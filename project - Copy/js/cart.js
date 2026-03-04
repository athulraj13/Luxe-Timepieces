// Cart functionality
document.addEventListener('DOMContentLoaded', function() {
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartItems = document.querySelector('.cart-items');
    const cartCount = document.querySelector('.cart-count');
    const cartTotal = document.querySelector('.cart-total span');
    const checkoutBtn = document.querySelector('.checkout-btn');

    // Load cart on page load
    loadCart();

    // Add to cart button click handler
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart')) {
            const productId = e.target.dataset.id;
            addToCart(productId);
        }
    });

    // Toggle cart sidebar
    document.querySelector('.cart-icon').addEventListener('click', function(e) {
        e.preventDefault();
        cartSidebar.classList.add('active');
    });

    document.querySelector('.close-cart').addEventListener('click', function() {
        cartSidebar.classList.remove('active');
    });

    // Checkout button click handler
    checkoutBtn.addEventListener('click', function() {
        window.location.href = '/payment';
    });

    // Function to add item to cart
    async function addToCart(productId) {
        try {
            const response = await fetch('/add_to_cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: 1
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                updateCartDisplay(data);
                cartSidebar.classList.add('active');
                showNotification('Product added to cart');
            } else {
                showNotification('Error adding product to cart', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error adding product to cart', 'error');
        }
    }

    // Function to load cart
    async function loadCart() {
        try {
            const response = await fetch('/get_cart');
            const data = await response.json();
            updateCartDisplay(data);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Function to update cart quantity
    async function updateCartQuantity(productId, quantity) {
        try {
            const response = await fetch('/update_cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: quantity
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                updateCartDisplay(data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Function to remove item from cart
    async function removeFromCart(productId) {
        try {
            const response = await fetch('/remove_from_cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product_id: productId
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                updateCartDisplay(data);
                showNotification('Product removed from cart');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Function to update cart display
    function updateCartDisplay(data) {
        cartCount.textContent = data.cart_count;
        
        cartItems.innerHTML = data.cart_items.map(item => `
            <div class="cart-item" data-id="${item.product_id}">
                <img src="/static/images/${item.image}" alt="${item.name}">
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <p>₹${item.price.toLocaleString()}</p>
                    <div class="quantity-controls">
                        <button class="quantity-btn minus">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn plus">+</button>
                    </div>
                </div>
                <button class="remove-item"><i class="fas fa-times"></i></button>
            </div>
        `).join('');

        const total = data.cart_items.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `₹${total.toLocaleString()}`;

        // Add event listeners for quantity controls
        document.querySelectorAll('.quantity-controls').forEach(control => {
            const item = control.closest('.cart-item');
            const productId = item.dataset.id;
            const quantitySpan = control.querySelector('.quantity');

            control.querySelector('.minus').addEventListener('click', () => {
                let quantity = parseInt(quantitySpan.textContent) - 1;
                if (quantity >= 1) {
                    updateCartQuantity(productId, quantity);
                }
            });

            control.querySelector('.plus').addEventListener('click', () => {
                let quantity = parseInt(quantitySpan.textContent) + 1;
                updateCartQuantity(productId, quantity);
            });
        });

        // Add event listeners for remove buttons
        document.querySelectorAll('.remove-item').forEach(button => {
            const item = button.closest('.cart-item');
            const productId = item.dataset.id;

            button.addEventListener('click', () => {
                removeFromCart(productId);
            });
        });
    }

    // Function to show notification
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}); 