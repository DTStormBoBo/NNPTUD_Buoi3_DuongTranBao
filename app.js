// ==================== BIẾN TOÀN CỤC ====================
const API_URL = 'https://api.escuelajs.co/api/v1/products';

let allProducts = [];      // Tất cả sản phẩm từ API
let filteredProducts = []; // Sản phẩm sau khi lọc/tìm kiếm
let currentPage = 1;       // Trang hiện tại
let pageSize = 10;         // Số sản phẩm mỗi trang
let priceSort = null;      // Sắp xếp theo giá: 'asc', 'desc', hoặc null
let nameSort = null;       // Sắp xếp theo tên: 'asc', 'desc', hoặc null
let selectedCategory = ''; // Danh mục đã chọn
let searchTimeout = null;  // Timeout cho debounce tìm kiếm
let isDataLoaded = false;  // Đánh dấu đã tải dữ liệu xong chưa

// ==================== HÀM LẤY DỮ LIỆU ====================

/**
 * Hàm getAll - Lấy tất cả sản phẩm từ API
 * @returns {Promise<Array>} Mảng chứa tất cả sản phẩm
 */
async function getAllProducts() {
    try {
        
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }
        
        const products = await response.json();
        
        console.log(` Đã tải thành công ${products.length} sản phẩm`);
        return products;
        
    } catch (error) {
        console.error(' Lỗi khi tải dữ liệu:', error);
        return [];
    }
}

// ==================== HÀM HIỂN THỊ ====================

/**
 * Hiển thị sản phẩm ra bảng
 */
function displayProducts() {
    const tableBody = document.getElementById('productTableBody');
    const resultsInfo = document.getElementById('resultsInfo');
    
    // Tính toán vị trí bắt đầu và kết thúc
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);
    
    // Cập nhật thông tin kết quả
    resultsInfo.textContent = `Hiển thị ${startIndex + 1} - ${Math.min(endIndex, filteredProducts.length)} trong tổng số ${filteredProducts.length} sản phẩm`;
    
    // Nếu không có sản phẩm
    if (productsToShow.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 50px; color: #666;">
                     Không tìm thấy sản phẩm nào
                </td>
            </tr>
        `;
        return;
    }
    
    // Tạo HTML cho các dòng sản phẩm
    let html = '';
    
    // Placeholder image dạng base64 (không cần load từ server)
    const placeholderImg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2U5ZWNlZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNDUlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzk5OSI+8J+WvO+4jzwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjY1JSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5OTkiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    
    // Placeholder nhỏ cho ảnh phụ
    const placeholderSmall = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZTllY2VmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOTk5Ij4/PC90ZXh0Pjwvc3ZnPg==';
    
    /**
     * Hàm làm sạch URL ảnh
     */
    function cleanImageUrl(url) {
        if (typeof url === 'string') {
            return url.replace(/^[\[\]"']+|[\[\]"']+$/g, '').trim();
        }
        return '';
    }
    
    productsToShow.forEach((product, index) => {
        // Lấy hình ảnh chính (ảnh đầu tiên)
        let mainImageUrl = placeholderImg;
        let subImages = []; // Mảng chứa các ảnh phụ
        
        if (product.images && product.images.length > 0) {
            // Ảnh chính
            let firstImage = cleanImageUrl(product.images[0]);
            if (firstImage.includes('http')) {
                mainImageUrl = firstImage;
            }
            
            // Các ảnh phụ (từ ảnh thứ 2 trở đi)
            for (let i = 1; i < product.images.length && i <= 3; i++) {
                let subImg = cleanImageUrl(product.images[i]);
                if (subImg.includes('http')) {
                    subImages.push(subImg);
                }
            }
        }
        
        // Tạo HTML cho các ảnh phụ
        let subImagesHtml = '';
        if (subImages.length > 0) {
            subImagesHtml = subImages.map(img => `
                <img src="${img}" 
                     class="sub-image" 
                     referrerpolicy="no-referrer"
                     onerror="this.onerror=null; this.src='${placeholderSmall}'">
            `).join('');
        } else {
            subImagesHtml = '<span class="no-sub-images">Không có ảnh phụ</span>';
        }
        
        // Cắt ngắn mô tả
        const shortDescription = product.description 
            ? (product.description.length > 100 
                ? product.description.substring(0, 100) + '...' 
                : product.description)
            : 'Không có mô tả';
        
        html += `
            <tr>
                <td><strong>#${product.id}</strong></td>
                <td>
                    <img src="${mainImageUrl}" 
                         alt="${product.title}" 
                         class="product-image"
                         referrerpolicy="no-referrer"
                         onerror="this.onerror=null; this.src='${placeholderImg}'">
                </td>
                <td class="product-title">${product.title}</td>
                <td class="product-price">$${product.price}</td>
                <td>
                    <span class="product-category">
                        ${product.category ? product.category.name : 'N/A'}
                    </span>
                </td>
                <td>${shortDescription}</td>
                <td class="sub-images-cell">
                    ${subImagesHtml}
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

/**
 * Cập nhật phân trang
 */
function updatePagination() {
    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageNumbers = document.getElementById('pageNumbers');
    
    // Cập nhật thông tin trang
    pageInfo.textContent = `Trang ${currentPage} / ${totalPages || 1}`;
    
    // Enable/disable nút trước/sau
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    
    // Tạo các nút số trang với dấu ...
    let pageNumbersHtml = '';
    
    if (totalPages <= 7) {
        // Nếu ít trang thì hiển thị hết
        for (let i = 1; i <= totalPages; i++) {
            pageNumbersHtml += createPageButton(i);
        }
    } else {
        // Luôn hiển thị trang 1
        pageNumbersHtml += createPageButton(1);
        
        if (currentPage > 3) {
            // Thêm dấu ... sau trang 1
            pageNumbersHtml += '<span class="page-dots">...</span>';
        }
        
        // Hiển thị các trang xung quanh trang hiện tại
        let startPage = Math.max(2, currentPage - 1);
        let endPage = Math.min(totalPages - 1, currentPage + 1);
        
        // Điều chỉnh để luôn hiển thị 3 trang ở giữa nếu có thể
        if (currentPage <= 3) {
            endPage = Math.min(4, totalPages - 1);
        }
        if (currentPage >= totalPages - 2) {
            startPage = Math.max(2, totalPages - 3);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pageNumbersHtml += createPageButton(i);
        }
        
        if (currentPage < totalPages - 2) {
            // Thêm dấu ... trước trang cuối
            pageNumbersHtml += '<span class="page-dots">...</span>';
        }
        
        // Luôn hiển thị trang cuối
        pageNumbersHtml += createPageButton(totalPages);
    }
    
    pageNumbers.innerHTML = pageNumbersHtml;
}

/**
 * Tạo HTML cho nút trang
 */
function createPageButton(pageNum) {
    return `
        <button class="${pageNum === currentPage ? 'active' : ''}" 
                onclick="goToPage(${pageNum})">
            ${pageNum}
        </button>
    `;
}

// ==================== HÀM XỬ LÝ SỰ KIỆN ====================

/**
 * Xử lý tìm kiếm - được gọi khi onChange với debounce
 */
function handleSearch() {
    // Debounce: Chờ 300ms sau khi người dùng ngừng gõ mới thực hiện tìm kiếm
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    searchTimeout = setTimeout(() => {
        performSearch();
    }, 300);
}

/**
 * Thực hiện tìm kiếm thực sự
 */
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => 
            product.title.toLowerCase().includes(searchTerm)
        );
    }
    
    // Áp dụng lại sắp xếp nếu có
    if (priceSort || nameSort) {
        applySorting();
    }
    
    // Reset về trang 1 và hiển thị
    currentPage = 1;
    displayProducts();
    updatePagination();
    
    console.log(`🔍 Tìm kiếm "${searchTerm}": tìm thấy ${filteredProducts.length} sản phẩm`);
}

/**
 * Xử lý sắp xếp theo giá từ dropdown
 */
function handlePriceSort() {
    const order = document.getElementById('priceSort').value;
    priceSort = order || null;
    
    // Áp dụng tìm kiếm và sắp xếp
    applyFiltersAndSort();
}

/**
 * Xử lý sắp xếp theo tên từ dropdown
 */
function handleNameSort() {
    const order = document.getElementById('nameSort').value;
    nameSort = order || null;
    
    // Áp dụng tìm kiếm và sắp xếp
    applyFiltersAndSort();
}

/**
 * Áp dụng tìm kiếm và tất cả bộ lọc sắp xếp
 */
function applyFiltersAndSort() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    // Bắt đầu với tất cả sản phẩm
    filteredProducts = [...allProducts];
    
    // Lọc theo danh mục
    if (selectedCategory) {
        filteredProducts = filteredProducts.filter(product => 
            product.category && product.category.id == selectedCategory
        );
    }
    
    // Lọc theo từ khóa tìm kiếm
    if (searchTerm !== '') {
        filteredProducts = filteredProducts.filter(product => 
            product.title.toLowerCase().includes(searchTerm)
        );
    }
    
    // Áp dụng sắp xếp
    if (priceSort || nameSort) {
        applySorting();
    }
    
    // Reset về trang 1 và hiển thị
    currentPage = 1;
    displayProducts();
    updatePagination();
    
    // Log trạng thái sắp xếp
    let sortStatus = [];
    if (priceSort) sortStatus.push(`Giá: ${priceSort === 'asc' ? 'Tăng' : 'Giảm'}`);
    if (nameSort) sortStatus.push(`Tên: ${nameSort === 'asc' ? 'A-Z' : 'Z-A'}`);
    if (sortStatus.length > 0) {
        console.log(`📊 Sắp xếp: ${sortStatus.join(', ')}`);
    }
}

/**
 * Áp dụng sắp xếp hiện tại (hỗ trợ 2 tiêu chí)
 * Ưu tiên: Giá trước, sau đó Tên (nếu giá bằng nhau)
 */
function applySorting() {
    filteredProducts.sort((a, b) => {
        // Sắp xếp theo giá trước (nếu có)
        if (priceSort) {
            const priceA = a.price;
            const priceB = b.price;
            
            if (priceA !== priceB) {
                if (priceSort === 'asc') {
                    return priceA - priceB;
                } else {
                    return priceB - priceA;
                }
            }
        }
        
        // Sắp xếp theo tên (nếu có, hoặc nếu giá bằng nhau)
        if (nameSort) {
            const nameA = a.title.toLowerCase();
            const nameB = b.title.toLowerCase();
            
            if (nameSort === 'asc') {
                return nameA.localeCompare(nameB);
            } else {
                return nameB.localeCompare(nameA);
            }
        }
        
        return 0;
    });
}

/**
 * Thay đổi số sản phẩm mỗi trang
 */
function changePageSize() {
    pageSize = parseInt(document.getElementById('pageSize').value);
    currentPage = 1;
    displayProducts();
    updatePagination();
    
    console.log(`📄 Đã thay đổi hiển thị: ${pageSize} sản phẩm/trang`);
}

/**
 * Chuyển trang (trước/sau)
 * @param {number} direction - Hướng chuyển (-1: trước, 1: sau)
 */
function changePage(direction) {
    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        displayProducts();
        updatePagination();
        
        // Scroll lên đầu bảng
        document.querySelector('.table-container').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}

/**
 * Đi đến trang cụ thể
 * @param {number} page - Số trang
 */
function goToPage(page) {
    currentPage = page;
    displayProducts();
    updatePagination();
    
    // Scroll lên đầu bảng
    document.querySelector('.table-container').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

// ==================== KHỞI TẠO ====================

/**
 * Lấy danh sách danh mục từ sản phẩm và đổ vào dropdown
 */
function populateCategories() {
    const categorySelect = document.getElementById('categoryFilter');
    if (!categorySelect) return;
    
    // Lấy tất cả danh mục unique từ sản phẩm
    const categories = [];
    const categoryIds = new Set();
    
    allProducts.forEach(product => {
        if (product.category && !categoryIds.has(product.category.id)) {
            categoryIds.add(product.category.id);
            categories.push({
                id: product.category.id,
                name: product.category.name
            });
        }
    });
    
    // Sắp xếp theo tên
    categories.sort((a, b) => a.name.localeCompare(b.name));
    
    // Tạo options
    let optionsHtml = '<option value="">-- Tất cả --</option>';
    categories.forEach(cat => {
        optionsHtml += `<option value="${cat.id}">${cat.name}</option>`;
    });
    
    categorySelect.innerHTML = optionsHtml;
    console.log(`📁 Đã tải ${categories.length} danh mục`);
}

/**
 * Xử lý lọc theo danh mục
 */
function handleCategoryFilter() {
    selectedCategory = document.getElementById('categoryFilter').value;
    applyFiltersAndSort();
}

/**
 * Hàm khởi tạo - chạy khi trang được tải
 */
async function init() {
    allProducts = await getAllProducts();
    filteredProducts = [...allProducts];
    
    // Đổ danh mục vào dropdown
    populateCategories();
    
    // Hiển thị dữ liệu
    displayProducts();
    updatePagination();
}

// Chạy khi DOM đã tải xong
document.addEventListener('DOMContentLoaded', init);
