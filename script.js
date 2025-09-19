const tileContainer = document.getElementById('tileContainer');
const viewTitle = document.getElementById('viewTitle');
const toolbar = document.querySelector('.toolbar');

const {
  dataFile = 'data/google-cloud-services.json',
  providerName = 'クラウド',
  providerKey: datasetProviderKey = '',
} = document.body.dataset;

const providerKey = datasetProviderKey || detectProviderKey(dataFile);

let categories = [];
let backButton = null;
let serviceGroupsByCategory = {};

function detectProviderKey(filePath) {
  if (!filePath) {
    return '';
  }

  if (filePath.includes('google-cloud')) {
    return 'google-cloud';
  }

  if (filePath.includes('azure')) {
    return 'azure';
  }

  if (filePath.includes('aws')) {
    return 'aws';
  }

  return '';
}

async function loadCategories(filePath) {
  const response = await fetch(filePath);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray(data.categories)) {
    return data.categories;
  }

  throw new Error('Unexpected data format.');
}

function createInfoMessage(text) {
  const message = document.createElement('p');
  message.className = 'info-message';
  message.textContent = text;
  return message;
}

function ensureBackButton() {
  if (!backButton) {
    backButton = document.createElement('button');
    backButton.id = 'backButton';
    backButton.className = 'back-button';
    backButton.type = 'button';
    backButton.textContent = '← カテゴリ一覧へ戻る';
    backButton.addEventListener('click', renderCategories);
  }

  if (!toolbar.contains(backButton)) {
    toolbar.insertBefore(backButton, viewTitle);
  }
}

function hideBackButton() {
  if (backButton && toolbar.contains(backButton)) {
    toolbar.removeChild(backButton);
  }
}

function showLoadError() {
  viewTitle.textContent = '読み込みエラー';
  hideBackButton();
  tileContainer.innerHTML = '';
  tileContainer.appendChild(
    createInfoMessage(
      `${providerName} のサービス情報を読み込めませんでした。ページを再読み込みしてもう一度お試しください。`
    )
  );
}

function renderCategories() {
  viewTitle.textContent = 'カテゴリ一覧';
  hideBackButton();
  tileContainer.innerHTML = '';
  tileContainer.classList.remove('grouped');

  if (categories.length === 0) {
    tileContainer.appendChild(createInfoMessage('表示できるカテゴリがありません。'));
    return;
  }

  categories.forEach((category) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tile category-tile';
    button.setAttribute('aria-label', `${category.name}のサービスを見る`);

    const badge = document.createElement('span');
    badge.className = 'category-badge';
    badge.textContent = `${Array.isArray(category.services) ? category.services.length : 0} サービス`;

    const title = document.createElement('h3');
    title.className = 'tile-title';
    title.textContent = category.name;

    const description = document.createElement('p');
    description.className = 'tile-description';
    description.textContent = category.description || '';

    button.append(badge, title, description);
    button.addEventListener('click', () => showServices(category));

    tileContainer.appendChild(button);
  });
}

function showServices(category) {
  viewTitle.textContent = `${category.name} のサービス`;
  ensureBackButton();
  tileContainer.innerHTML = '';

  const services = Array.isArray(category.services) ? category.services : [];

  if (services.length === 0) {
    tileContainer.appendChild(createInfoMessage('このカテゴリには表示できるサービスがありません。'));
    return;
  }

  const groups = resolveServiceGroups(category, services);
  const hasGroups = Array.isArray(groups) && groups.length > 0;

  tileContainer.classList.toggle('grouped', hasGroups);

  if (hasGroups) {
    groups.forEach((group, index) => {
      const section = document.createElement('section');
      section.className = 'service-group';
      section.setAttribute('role', 'group');

      const hasHeaderContent = Boolean(group.title) || Boolean(group.description);

      if (hasHeaderContent) {
        const header = document.createElement('header');
        header.className = 'service-group-header';

        if (group.title) {
          const heading = document.createElement('h3');
          heading.className = 'service-group-title';
          heading.textContent = group.title;
          const headingId = `service-group-${index}`;
          heading.id = headingId;
          section.setAttribute('aria-labelledby', headingId);
          header.appendChild(heading);
        }

        if (group.description) {
          const description = document.createElement('p');
          description.className = 'service-group-description';
          description.textContent = group.description;
          header.appendChild(description);
        }

        section.appendChild(header);
      }

      const groupGrid = document.createElement('div');
      groupGrid.className = 'service-group-grid';
      group.services.forEach((service) => {
        groupGrid.appendChild(createServiceTile(service));
      });

      section.appendChild(groupGrid);
      tileContainer.appendChild(section);
    });

    return;
  }

  services.forEach((service) => {
    tileContainer.appendChild(createServiceTile(service));
  });
}

function toggleServiceTile(tile) {
  const willFlip = !tile.classList.contains('flipped');

  tileContainer.querySelectorAll('.service-tile.flipped').forEach((otherTile) => {
    if (otherTile !== tile) {
      otherTile.classList.remove('flipped');
      otherTile.setAttribute('aria-pressed', 'false');
    }
  });

  tile.classList.toggle('flipped', willFlip);
  tile.setAttribute('aria-pressed', willFlip ? 'true' : 'false');
}

function createServiceTile(service) {
  const tile = document.createElement('div');
  tile.className = 'tile service-tile';
  tile.tabIndex = 0;
  tile.setAttribute('role', 'button');
  tile.setAttribute('aria-pressed', 'false');
  tile.setAttribute('aria-label', `${service.name} の詳細を表示`);

  const inner = document.createElement('div');
  inner.className = 'tile-inner';

  const front = document.createElement('div');
  front.className = 'tile-face tile-front';

  const title = document.createElement('h3');
  title.className = 'tile-title';
  title.textContent = service.name;

  const summary = document.createElement('p');
  summary.className = 'tile-description';
  summary.textContent = service.summary || '';

  const hint = document.createElement('span');
  hint.className = 'pill';
  hint.textContent = 'クリックで詳細表示';

  front.append(title, summary, hint);

  const back = document.createElement('div');
  back.className = 'tile-face tile-back';

  const backBody = document.createElement('div');
  backBody.className = 'tile-back-body';

  const details = document.createElement('p');
  details.textContent = service.details || '';
  backBody.appendChild(details);

  const featureList = document.createElement('ul');
  (service.features || []).forEach((feature) => {
    const item = document.createElement('li');
    item.textContent = feature;
    featureList.appendChild(item);
  });
  backBody.appendChild(featureList);

  const link = document.createElement('a');
  link.href = service.link || '#';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = '公式サイトを見る';
  link.addEventListener('click', (event) => event.stopPropagation());

  back.append(backBody, link);

  inner.append(front, back);
  tile.appendChild(inner);

  tile.addEventListener('click', () => toggleServiceTile(tile));
  tile.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleServiceTile(tile);
    }
  });

  return tile;
}

function resolveServiceGroups(category, services) {
  const configDefinitions = serviceGroupsByCategory[category.id];
  const groupsFromConfig = createGroupsFromConfig(configDefinitions, services);

  if (Array.isArray(groupsFromConfig) && groupsFromConfig.length > 0) {
    return groupsFromConfig;
  }

  const groupsFromServiceField = createGroupsFromServiceField(services);

  if (Array.isArray(groupsFromServiceField) && groupsFromServiceField.length > 0) {
    return groupsFromServiceField;
  }

  return null;
}

function createGroupsFromConfig(definitions, services) {
  if (!Array.isArray(definitions) || definitions.length === 0) {
    return null;
  }

  const serviceByName = new Map();
  services.forEach((service) => {
    if (service && service.name) {
      serviceByName.set(service.name, service);
    }
  });

  const assigned = new Set();
  const groups = [];

  definitions.forEach((definition) => {
    if (!definition || !Array.isArray(definition.services)) {
      return;
    }

    const matchedServices = [];

    definition.services.forEach((serviceName) => {
      const service = serviceByName.get(serviceName);
      if (service && !assigned.has(service.name)) {
        matchedServices.push(service);
        assigned.add(service.name);
      }
    });

    if (matchedServices.length > 0) {
      groups.push({
        title: definition.title || '',
        description: definition.description || '',
        services: matchedServices,
      });
    }
  });

  const remainingServices = services.filter((service) => !assigned.has(service.name));

  if (remainingServices.length > 0) {
    const hasNamedGroup = groups.some((group) => Boolean(group.title));
    groups.push({
      title: hasNamedGroup ? 'その他のサービス' : '',
      description: '',
      services: remainingServices,
    });
  }

  return groups.some((group) => Boolean(group.title)) ? groups : null;
}

function createGroupsFromServiceField(services) {
  if (!Array.isArray(services) || services.length === 0) {
    return null;
  }

  const map = new Map();
  let hasNamedGroup = false;

  services.forEach((service) => {
    const groupName = typeof service.group === 'string' ? service.group.trim() : '';
    const key = groupName || '__default__';

    if (!map.has(key)) {
      map.set(key, {
        title: groupName,
        description: '',
        services: [],
      });
    }

    const entry = map.get(key);

    if (!entry.description && typeof service.groupDescription === 'string') {
      entry.description = service.groupDescription;
    }

    entry.services.push(service);

    if (groupName) {
      hasNamedGroup = true;
    }
  });

  if (!hasNamedGroup) {
    return null;
  }

  const defaultGroup = map.get('__default__');

  if (defaultGroup) {
    defaultGroup.title = 'その他のサービス';
  }

  return Array.from(map.values()).filter((group) => group.services.length > 0);
}

async function loadServiceGroups() {
  try {
    const response = await fetch('data/service-groups.json');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('サービスのグループ定義を読み込めませんでした。', error);
    return {};
  }
}

async function initialize() {
  try {
    const [loadedCategories, groupConfig] = await Promise.all([
      loadCategories(dataFile),
      loadServiceGroups(),
    ]);

    categories = loadedCategories;
    serviceGroupsByCategory =
      (providerKey && groupConfig && groupConfig[providerKey]) || {};

    renderCategories();
  } catch (error) {
    console.error(`Failed to load ${providerName} services data.`, error);
    showLoadError();
  }
}

document.addEventListener('DOMContentLoaded', initialize);
