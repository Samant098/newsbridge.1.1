const API_KEY = 'joqqkvvgfdt5ypehapjflyjdlkqjv7zyd0uviosy';
const feeds = {
    india: 'https://www.thehindu.com/news/national/feeder/default.rss',
    world: 'http://feeds.bbci.co.uk/news/world/rss.xml'
};

let currentPage = 1;
const itemsPerPage = 10;
let allArticles = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadNews();
    setupFilters();
});

// News Loading
async function loadNews() {
    try {
        const [indiaRes, worldRes] = await Promise.all([
            fetchNews(feeds.india, 'The Hindu'),
            fetchNews(feeds.world, 'BBC News')
        ]);
        
        allArticles = [...indiaRes, ...worldRes];
        showNews(currentPage);
        createPagination(allArticles.length);
    } catch (error) {
        console.error('News loading failed:', error);
    }
}

async function fetchNews(url, source) {
    try {
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${url}&api_key=${API_KEY}`);
        const data = await response.json();
        return (data.items || []).map(item => ({
            ...item,
            source,
            type: url.includes('india') ? 'india' : 'world',
            image: item.enclosure?.link || item.media?.content?.url
        }));
    } catch (error) {
        console.error('Feed error:', error);
        return [];
    }
}

// Display News
function showNews(page) {
    currentPage = page;
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const articlesToShow = allArticles.slice(start, end);
    
    const container = document.getElementById('newsContainer');
    container.innerHTML = articlesToShow.map((article, index) => `
        <article class="news-article" data-type="${article.type}">
            <div class="article-header">
                <span class="article-number">${start + index + 1}</span>
                <div class="article-source">${article.source}</div>
            </div>
            <div class="article-content">
                <div class="article-image">
                    <img class="news-image" 
                         src="${getImageUrl(article)}" 
                         alt="${article.title}"
                         loading="lazy"
                         onerror="this.src='${getFallbackImage(article)}'">
                </div>
                <div class="article-details">
                    <h2>${article.title}</h2>
                    <p class="article-excerpt">${generateSummary(article.description)}</p>
                    <a href="${article.link}" class="read-more" target="_blank">
                        Full Article <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            </div>
        </article>
    `).join('');
    
    updatePagination();
}

// Image Handling
function getImageUrl(article) {
    return article.image ? 
        `https://images.weserv.nl/?url=${encodeURIComponent(article.image)}` : 
        getFallbackImage(article);
}

function getFallbackImage(article) {
    const keywords = encodeURIComponent(article.title.split(' ').slice(0, 3).join('+'));
    return `https://source.unsplash.com/600x400/?${keywords},${article.type}`;
}

function generateSummary(text) {
    return text.replace(/<[^>]+>/g, '')
              .split(/\s+/)
              .slice(0, 90)
              .join(' ') + '...';
}

// Pagination
function createPagination(totalItems) {
    const pageCount = Math.ceil(totalItems / itemsPerPage);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = Array.from({length: pageCount}, (_, i) => 
        `<button class="page-btn" data-page="${i + 1}">${i + 1}</button>`
    ).join('');
    
    pagination.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentPage = parseInt(btn.dataset.page);
            showNews(currentPage);
        });
    });
}

function updatePagination() {
    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.page) === currentPage);
    });
}

// Filter System
function setupFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => 
                b.classList.remove('active')
            );
            btn.classList.add('active');
            filterNews(btn.dataset.filter);
        });
    });
}

function filterNews(type) {
    const filtered = type === 'all' ? 
        allArticles : 
        allArticles.filter(article => article.type === type);
    
    currentPage = 1;
    showNews(currentPage);
    createPagination(filtered.length);
}