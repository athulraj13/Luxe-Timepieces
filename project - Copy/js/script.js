// Sample product data
const products = [
    {
        id: 1,
        name: "Royal Oak Chronograph",
        brand: "Audemars Piguet",
        price: 59000,
        category: "swiss",
        image: "../images/APRO.avif"
    },
    {
        id: 4,
        name: "Portuguese Chronograph",
        brand: "IWC",
        price: 8500,
        category: "classic",
        image: "../images/IWC.avif"
    },
    {
        id: 5,
        name: "Luminor Marina",
        brand: "Panerai",
        price: 12000,
        category: "limited",
        image: "../images/LM.avif"
    }
];

// Additional products for collection page
const allProducts = [
    ...products,
    {
        id: 2,
        name: "Nautilus",
        brand: "Patek Philippe",
        price: 75000,
        category: "swiss",
        image: "../images/PP.jpg"
    },
    {
        id: 3,
        name: "Submariner",
        brand: "Rolex",
        price: 15000,
        category: "swiss",
        image: "../images/ROLEX.avif"
    },
    {
        id: 6,
        name: "Speedmaster Moonwatch",
        brand: "Omega",
        price: 6500,
        category: "classic",
        image: "../images/OMEGA.webp"
    },
    {
        id: 7,
        name: "Reverso Classic",
        brand: "Jaeger-LeCoultre",
        price: 9800,
        category: "classic",
        image: "../images/RC.webp"
    },
    {
        id: 8,
        name: "Big Bang Unico",
        brand: "Hublot",
        price: 45000,
        category: "limited",
        image: "../images/HUBLOT.png"
    }
];

// Cart functionality
let cart = [];
let cartTotal = 0;

// DOM Elements
const productsGrid = document.querySelector('.products-grid');
const filterButtons = document.querySelectorAll('.filter-btn');
const cartSidebar = document.querySelector('.cart-sidebar');
const cartItems = document.querySelector('.cart-items');
const cartCount = document.querySelector('.cart-count');
const cartTotalElement = document.querySelector('.cart-total span');
const closeCartButton = document.querySelector('.close-cart');
const cartIcon = document.querySelector('.cart-icon');
const checkoutButton = document.querySelector('.checkout-btn');
const newsletterForm = document.querySelector('.newsletter-form');
const contactForm = document.querySelector('.contact-form');
const sortSelect = document.querySelector('#sort-by');

// Initialize the website
function init() {
    // Check if we're on the collection page
    if (window.location.pathname.includes('collection.html')) {
        displayCollectionProducts('all');
    }
    setupEventListeners();
}

// Sort products
function sortProducts(products, sortBy) {
    const sortedProducts = [...products];
    switch (sortBy) {
        case 'price-low':
            return sortedProducts.sort((a, b) => a.price - b.price);
        case 'price-high':
            return sortedProducts.sort((a, b) => b.price - a.price);
        case 'name':
            return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
        default:
            return sortedProducts;
    }
}

// Display products for collection page
function displayCollectionProducts(category, sortBy = 'default') {
    if (!window.location.pathname.includes('collection.html')) return;
    
    let filteredProducts = category === 'all' 
        ? allProducts 
        : allProducts.filter(product => product.category === category);

    // Apply sorting if specified
    if (sortBy !== 'default') {
        filteredProducts = sortProducts(filteredProducts, sortBy);
    }

    productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-brand">${product.brand}</p>
                <p class="product-category">${product.category}</p>
                <p class="product-price">₹${product.price.toLocaleString()}</p>
                <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

// Setup event listeners
function setupEventListeners() {
    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const currentSort = sortSelect ? sortSelect.value : 'default';
            displayCollectionProducts(button.dataset.filter, currentSort);
        });
    });

    // Sort select
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            const currentFilter = document.querySelector('.filter-btn.active').dataset.filter;
            displayCollectionProducts(currentFilter, sortSelect.value);
        });
    }

    // Add to cart buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart')) {
            const productId = parseInt(e.target.dataset.id);
            addToCart(productId);
        }
    });

    // Cart toggle
    cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        cartSidebar.classList.add('active');
    });

    closeCartButton.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
    });

    // Checkout button
    checkoutButton.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        // Save cart to localStorage before redirecting
        localStorage.setItem('cart', JSON.stringify(cart));
        // Redirect to payment page
        window.location.href = 'payment.html';
    });

    // Newsletter form
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = newsletterForm.querySelector('input').value;
            alert(`Thank you for subscribing with: ${email}`);
            newsletterForm.reset();
        });
    }

    // Contact form
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thank you for your message. We will get back to you soon!');
            contactForm.reset();
        });
    }

    // Close cart when clicking outside
    document.addEventListener('click', (e) => {
        if (!cartSidebar.contains(e.target) && !cartIcon.contains(e.target)) {
            cartSidebar.classList.remove('active');
        }
    });

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
}

// Add product to cart
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    updateCart();
    cartSidebar.classList.add('active');
}

// Update cart display
function updateCart() {
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover;">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p>₹${item.price.toLocaleString()} x ${item.quantity}</p>
            </div>
            <button class="remove-item" onclick="removeFromCart(${item.id})">×</button>
        </div>
    `).join('');

    cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    cartTotalElement.textContent = `₹${cartTotal.toLocaleString()}`;
}

// Remove item from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
}

// Clear cart
function clearCart() {
    cart = [];
    updateCart();
    cartSidebar.classList.remove('active');
}

// Add smooth scroll behavior for navbar
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
    } else {
        navbar.style.background = 'var(--white)';
    }
});

// Initialize the website when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 