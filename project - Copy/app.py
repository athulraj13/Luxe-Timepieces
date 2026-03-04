from flask import Flask, render_template, request, jsonify, redirect, url_for, session, flash
from pymongo import MongoClient
from bson import ObjectId
import bcrypt
import os
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'
app.config['SESSION_TYPE'] = 'filesystem'

# MongoDB connection
try:
    client = MongoClient('mongodb://localhost:27017/')
    db = client['luxe_timepieces']
    products = db.products
    orders = db.orders
    users = db.users
    logger.info("Connected to MongoDB successfully!")
    logger.info(f"Found {products.count_documents({})} products in database")
except Exception as e:
    logger.error(f"Error connecting to MongoDB: {e}")

# Routes
@app.route('/')
@app.route('/index')
@app.route('/index.html')
def home():
    try:
        # Fetch featured products from MongoDB
        featured_products = list(products.find().limit(3))
        # Convert ObjectId to string for each product
        for product in featured_products:
            product['_id'] = str(product['_id'])
        return render_template('index.html', products=featured_products)
    except Exception as e:
        print(f"Error fetching products: {e}")
        return render_template('index.html', products=[])

@app.route('/collection')
@app.route('/collection.html')
def collection():
    try:
        # Fetch all products
        all_products = list(products.find())
        logger.info(f"Found {len(all_products)} products in database")
        
        # Convert ObjectId to string for each product
        for product in all_products:
            product['_id'] = str(product['_id'])
        
        return render_template('collection.html', products=all_products)
    except Exception as e:
        logger.error(f"Error in collection route: {e}")
        return render_template('collection.html', products=[])

@app.route('/about')
@app.route('/about.html')
def about():
    return render_template('about.html')

@app.route('/contact')
@app.route('/contact.html')
def contact():
    return render_template('contact.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = users.find_one({'email': email})
        
        if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
            # Store user info in session
            session['user_id'] = str(user['_id'])
            session['user_email'] = user['email']
            session['user_name'] = user.get('name', 'User')
            
            # Flash success message
            flash('Welcome back! You have successfully logged in.', 'success')
            return redirect(url_for('home'))
        else:
            flash('Invalid email or password. Please try again.', 'error')
            return render_template('login.html')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        try:
            # Get form data
            name = request.form.get('name')
            email = request.form.get('email')
            password = request.form.get('password')
            confirm_password = request.form.get('confirm_password')

            # Validate passwords match
            if password != confirm_password:
                flash('Passwords do not match!', 'error')
                return redirect(url_for('login'))

            # Check if user already exists
            if users.find_one({'email': email}):
                flash('Email already registered. Please login instead.', 'error')
                return redirect(url_for('login'))

            # Hash password
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

            # Create new user
            new_user = {
                'name': name,
                'email': email,
                'password': hashed_password,
                'created_at': datetime.now()
            }

            # Insert user into database
            users.insert_one(new_user)

            # Flash success message
            flash('Registration successful! Please login.', 'success')
            return redirect(url_for('login'))

        except Exception as e:
            print(f"Registration error: {str(e)}")
            flash('Registration failed. Please try again.', 'error')
            return redirect(url_for('login'))

    return redirect(url_for('login'))

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out successfully.', 'success')
    return redirect(url_for('home'))

@app.route('/payment')
def payment():
    if 'cart' not in session or not session['cart']:
        return redirect(url_for('collection'))
    
    cart_items = session['cart']
    subtotal = sum(item['price'] * item['quantity'] for item in cart_items)
    shipping = 500 if subtotal < 100000 else 0  # Free shipping for orders over ₹100,000
    tax = subtotal * 0.1  # 10% tax
    total = subtotal + shipping + tax
    
    return render_template('payment.html', 
                         cart_items=cart_items,
                         subtotal=subtotal,
                         shipping=shipping,
                         tax=tax,
                         total=total)

@app.route('/process_payment', methods=['POST'])
def process_payment():
    try:
        if 'cart' not in session or not session['cart']:
            return jsonify({'error': 'Empty cart'}), 400

        # Get form data
        data = request.form
        
        # Create order in database
        order = {
            'cart_items': session['cart'],
            'total_amount': sum(item['price'] * item['quantity'] for item in session['cart']),
            'shipping_address': {
                'full_name': data.get('full-name'),
                'email': data.get('email'),
                'address': data.get('address'),
                'city': data.get('city'),
                'state': data.get('state'),
                'zip': data.get('zip'),
                'country': data.get('country')
            },
            'payment_info': {
                'card_name': data.get('card-name'),
                'card_number': data.get('card-number')[-4:],  # Store only last 4 digits
                'order_date': datetime.now()
            },
            'status': 'completed'
        }
        
        # Insert order into database
        orders.insert_one(order)
        
        # Clear the cart
        session.pop('cart', None)
        
        return jsonify({'success': True, 'message': 'Payment processed successfully'})
    except Exception as e:
        print(f"Payment processing error: {str(e)}")
        return jsonify({'error': 'Payment processing failed'}), 500

@app.route('/cart')
def view_cart():
    cart = session.get('cart', [])
    return render_template('cart.html', cart=cart)

@app.route('/add_to_cart', methods=['POST'])
def add_to_cart():
    try:
        data = request.get_json()
        print("Received add to cart request:", data)  # Debug print
        product_id = data.get('product_id')
        
        # Initialize cart if it doesn't exist
        if 'cart' not in session:
            session['cart'] = []
        
        # Get product from database
        product = products.find_one({'_id': ObjectId(product_id)})
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Check if product already in cart
        cart = session['cart']
        product_in_cart = False
        
        for item in cart:
            if item.get('product_id') == product_id:
                item['quantity'] += 1
                product_in_cart = True
                break
        
        if not product_in_cart:
            # Add new product to cart
            cart.append({
                'product_id': product_id,
                'name': product['name'],
                'price': product['price'],
                'quantity': 1,
                'image': product['image']
            })
        
        session.modified = True
        
        # Calculate total items in cart
        total_items = sum(item['quantity'] for item in cart)
        
        return jsonify({
            'success': True,
            'message': 'Product added to cart',
            'cart_count': total_items,
            'cart': cart
        })
    
    except Exception as e:
        print("Error in add_to_cart:", str(e))  # Debug print
        return jsonify({'error': str(e)}), 500

@app.route('/get_cart')
def get_cart():
    cart = session.get('cart', [])
    total_items = sum(item['quantity'] for item in cart)
    return jsonify({
        'cart': cart,
        'cart_count': total_items
    })

@app.route('/update_cart', methods=['POST'])
def update_cart():
    data = request.get_json()
    product_id = data.get('product_id')
    quantity = data.get('quantity', 0)
    
    if 'cart' in session:
        cart = session['cart']
        for item in cart:
            if item['product_id'] == product_id:
                if quantity > 0:
                    item['quantity'] = quantity
                else:
                    cart.remove(item)
                break
        
        session['cart'] = cart
        session.modified = True
        
        total_items = sum(item['quantity'] for item in cart)
        return jsonify({
            'success': True,
            'cart': cart,
            'cart_count': total_items
        })
    
    return jsonify({'error': 'Cart not found'}), 404

@app.route('/remove_from_cart', methods=['POST'])
def remove_from_cart():
    data = request.get_json()
    product_id = data.get('product_id')
    
    if 'cart' in session:
        cart = session['cart']
        cart = [item for item in cart if item['product_id'] != product_id]
        session['cart'] = cart
        session.modified = True
        
        total_items = sum(item['quantity'] for item in cart)
        return jsonify({
            'success': True,
            'cart': cart,
            'cart_count': total_items
        })
    
    return jsonify({'error': 'Cart not found'}), 404

@app.route('/check-image')
def check_image():
    import os
    image_path = os.path.join(app.static_folder, 'images', 'bg.jpg')
    exists = os.path.exists(image_path)
    return f"""
    <h1>Image Check</h1>
    <p>Image path: {image_path}</p>
    <p>Image exists: {exists}</p>
    <p>Static folder: {app.static_folder}</p>
    <p>Available images: {os.listdir(os.path.join(app.static_folder, 'images'))}</p>
    <img src="{url_for('static', filename='images/bg.jpg')}" alt="Test">
    """

@app.route('/check-products')
def check_products():
    try:
        all_products = list(products.find())
        return jsonify({
            "product_count": len(all_products),
            "products": [{
                "name": p["name"],
                "brand": p["brand"],
                "category": p["category"],
                "image": p["image"],
                "price": p["price"]
            } for p in all_products]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/check-images')
def check_images():
    import os
    image_dir = os.path.join(app.static_folder, 'images')
    images = os.listdir(image_dir)
    
    html = "<h1>Available Images</h1><ul>"
    for img in images:
        img_url = url_for('static', filename=f'images/{img}')
        html += f"""
        <li>
            {img}<br>
            <img src="{img_url}" style="max-width: 200px"><br>
            Path: {os.path.join(image_dir, img)}<br>
            Exists: {os.path.exists(os.path.join(image_dir, img))}
        </li>
        """
    html += "</ul>"
    return html

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500

def check_templates():
    template_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
    required_templates = [
        'index.html',
        'collection.html',
        'about.html',
        'contact.html',
        'login.html',
        'payment.html',
        '404.html',
        '500.html'
    ]
    
    print("Checking templates in:", template_dir)
    existing_templates = os.listdir(template_dir)
    
    for template in required_templates:
        if template in existing_templates:
            print(f"✓ Found {template}")
        else:
            print(f"✗ Missing {template}")

def init_products():
    try:
        # First, remove all existing products
        products.delete_many({})
        
        default_products = [
            {
                "name": "Royal Oak Chronograph",
                "brand": "Audemars Piguet",
                "price": 59000,
                "category": "swiss",
                "image": "APRO.avif",
                "description": "Iconic luxury sports watch",
                "stock": 5
            },
            {
                "name": "Nautilus",
                "brand": "Patek Philippe",
                "price": 75000,
                "category": "swiss",
                "image": "PP.jpg",
                "description": "Elegant sports luxury timepiece",
                "stock": 3
            },
            {
                "name": "Submariner",
                "brand": "Rolex",
                "price": 15000,
                "category": "swiss",
                "image": "ROLEX.avif",
                "description": "Classic diving watch",
                "stock": 8
            },
            {
                "name": "Portuguese Chronograph",
                "brand": "IWC",
                "price": 8500,
                "category": "classic",
                "image": "IWC.avif",
                "description": "Sophisticated chronograph",
                "stock": 10
            },
            {
                "name": "Luminor Marina",
                "brand": "Panerai",
                "price": 12000,
                "category": "limited",
                "image": "LM.avif",
                "description": "Bold Italian design",
                "stock": 6
            },
            {
                "name": "Speedmaster Moonwatch",
                "brand": "Omega",
                "price": 6500,
                "category": "classic",
                "image": "OMEGA.webp",
                "description": "Legendary chronograph worn on the moon",
                "stock": 12
            },
            {
                "name": "Reverso Classic",
                "brand": "Jaeger-LeCoultre",
                "price": 9800,
                "category": "classic",
                "image": "RC.webp",
                "description": "Art Deco masterpiece with reversible case",
                "stock": 7
            },
            {
                "name": "Big Bang Unico",
                "brand": "Hublot",
                "price": 45000,
                "category": "limited",
                "image": "HUBLOT.png",
                "description": "Bold contemporary chronograph",
                "stock": 4
            }
        ]
        
        # Insert all products
        result = products.insert_many(default_products)
        logger.info(f"Successfully inserted {len(result.inserted_ids)} products")
        return True
    except Exception as e:
        logger.error(f"Error initializing products: {e}")
        return False

@app.route('/reset-products')
def reset_products():
    try:
        success = init_products()
        if success:
            return jsonify({
                "message": "Products reset successfully",
                "product_count": products.count_documents({})
            })
        else:
            return jsonify({"error": "Failed to reset products"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Initialize products on startup
    init_products()
    check_templates()
    app.run(debug=True)
