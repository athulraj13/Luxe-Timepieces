// Get cart data from localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let allProducts = [
    {
        id: 1,
        name: "Royal Oak Chronograph",
        brand: "Audemars Piguet",
        price: 59000,
        category: "swiss",
        image: "../images/APRO.avif"
    },
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

// DOM Elements
const orderItems = document.querySelector('.order-items');
const subtotalElement = document.getElementById('subtotal');
const shippingElement = document.getElementById('shipping');
const taxElement = document.getElementById('tax');
const totalElement = document.getElementById('total');
const paymentForm = document.getElementById('payment-form');
const cartCount = document.querySelector('.cart-count');

// Initialize the page
function init() {
    if (cart.length === 0) {
        window.location.href = 'collection.html';
        return;
    }
    displayOrderItems();
    calculateTotals();
    updateCartCount();
}

// Display order items
function displayOrderItems() {
    orderItems.innerHTML = cart.map(item => {
        const product = allProducts.find(p => p.id === item.id);
        return `
            <div class="order-item">
                <img src="${product.image}" alt="${product.name}">
                <div class="item-details">
                    <h4>${product.name}</h4>
                    <p>${product.brand}</p>
                    <p>Quantity: ${item.quantity}</p>
                    <p>₹${(product.price * item.quantity).toLocaleString()}</p>
                </div>
            </div>
        `;
    }).join('');
}

// Calculate totals
function calculateTotals() {
    const subtotal = cart.reduce((total, item) => {
        const product = allProducts.find(p => p.id === item.id);
        return total + (product.price * item.quantity);
    }, 0);

    const shipping = subtotal > 100000 ? 0 : 500;
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + shipping + tax;

    subtotalElement.textContent = `₹${subtotal.toLocaleString()}`;
    shippingElement.textContent = `₹${shipping.toLocaleString()}`;
    taxElement.textContent = `₹${tax.toLocaleString()}`;
    totalElement.textContent = `₹${total.toLocaleString()}`;
}

// Update cart count
function updateCartCount() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
}

// Handle form submission
paymentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Here you would typically send the payment information to a payment processor
    // For demo purposes, we'll just show a success message
    alert('Payment successful! Thank you for your purchase.');
    
    // Clear cart
    localStorage.removeItem('cart');
    
    // Redirect to home page
    window.location.href = 'index.html';
});

// Format card number input
const cardNumber = document.getElementById('card-number');
cardNumber.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})/g, '$1 ').trim();
    e.target.value = value;
});

// Format expiry date input
const expiry = document.getElementById('expiry');
expiry.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2);
    }
    e.target.value = value;
});

// Format CVV input
const cvv = document.getElementById('cvv');
cvv.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
});

// Initialize the page when loaded
document.addEventListener('DOMContentLoaded', init); 