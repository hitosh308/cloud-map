const tileContainer = document.getElementById('tileContainer');
const viewTitle = document.getElementById('viewTitle');
const toolbar = document.querySelector('.toolbar');

const { dataFile = 'data/google-cloud-services.json', providerName = 'クラウド' } =
  document.body.dataset;

let categories = [];
let backButton = null;

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

  services.forEach((service) => {
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

    tileContainer.appendChild(tile);
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

async function initialize() {
  try {
    categories = await loadCategories(dataFile);
    renderCategories();
  } catch (error) {
    console.error(`Failed to load ${providerName} services data.`, error);
    showLoadError();
  }
}

document.addEventListener('DOMContentLoaded', initialize);
