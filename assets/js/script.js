// cart management with localStorage
const cartManager = {
    getCart() {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    },

    addToCart(productId, productName, price, image, quantity = 1) {
        const cart = this.getCart();
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                id: productId,
                name: productName,
                price: price,
                image: image,
                quantity: quantity
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        this.updateCartBadge();
    },

    updateCartItem(productId, quantity) {
        const cart = this.getCart();
        const item = cart.find(item => item.id === productId);
        
        if (item) {
            item.quantity = quantity;
            localStorage.setItem('cart', JSON.stringify(cart));
        }
        
        this.updateCartBadge();
    },

    removeFromCart(productId) {
        let cart = this.getCart();
        cart = cart.filter(item => item.id !== productId);
        localStorage.setItem('cart', JSON.stringify(cart));
        this.updateCartBadge();
    },

    clearCart() {
        localStorage.removeItem('cart');
        this.updateCartBadge();
    },

    getTotalItems() {
        return this.getCart().reduce((total, item) => total + item.quantity, 0);
    },

    getTotalPrice() {
        return this.getCart().reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    updateCartBadge() {
        const badges = document.querySelectorAll('.cart-badge');
        const totalItems = this.getTotalItems();
        
        badges.forEach(badge => {
            badge.textContent = totalItems;
        });
    }
};

// initialize cart badge on page load
document.addEventListener('DOMContentLoaded', function() {
    cartManager.updateCartBadge();
    
    // initialize cart page if we're on it
    if (document.querySelector('.cart-items-container')) {
        renderCartItems();
    }
    
    // add event listeners for add to cart buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const productCard = this.closest('.product-card, .product-detail');
            if (!productCard) return;
            
            const productId = productCard.dataset.productId;
            const productName = productCard.dataset.productName;
            const productPrice = parseFloat(productCard.dataset.productPrice);
            const productImage = productCard.dataset.productImage;
            
            // get quantity if available
            let quantity = 1;
            const quantityInput = productCard.querySelector('.quantity-input');
            if (quantityInput) {
                quantity = parseInt(quantityInput.value, 10);
            }
            
            cartManager.addToCart(productId, productName, productPrice, productImage, quantity);
            
            // show confirmation toast
            const toast = new bootstrap.Toast(document.getElementById('addToCartToast'));
            toast.show();
        });
    });
});

// render cart items on cart page
function renderCartItems() {
    const cartContainer = document.querySelector('.cart-items-container');
    if (!cartContainer) return;
    
    const cart = cartManager.getCart();
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="alert alert-info">Your cart is empty</div>';
        document.querySelector('.cart-summary').classList.add('d-none');
        return;
    }
    
    document.querySelector('.cart-summary').classList.remove('d-none');
    
    let cartHTML = '';
    let subtotal = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        cartHTML += `
        <div class="card mb-3 cart-item" data-product-id="${item.id}">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-2">
                        <img src="${item.image}" alt="${item.name}" class="cart-item-img img-fluid rounded">
                    </div>
                    <div class="col-md-4">
                        <h5 class="card-title">${item.name}</h5>
                    </div>
                    <div class="col-md-2">
                        <span class="text-muted">$${item.price.toFixed(2)}</span>
                    </div>
                    <div class="col-md-2">
                        <div class="input-group input-group-sm">
                            <button class="btn btn-outline-secondary decrease-qty" type="button">-</button>
                            <input type="number" class="form-control text-center item-quantity" value="${item.quantity}" min="1">
                            <button class="btn btn-outline-secondary increase-qty" type="button">+</button>
                        </div>
                    </div>
                    <div class="col-md-1">
                        <span class="fw-bold">$${itemTotal.toFixed(2)}</span>
                    </div>
                    <div class="col-md-1 text-end">
                        <button class="btn btn-sm btn-outline-danger remove-item">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    });
    
    cartContainer.innerHTML = cartHTML;
    
    // update summary
    document.querySelector('.subtotal-value').textContent = `$${subtotal.toFixed(2)}`;
    const taxRate = 0.08; // 8%
    const tax = subtotal * taxRate;
    document.querySelector('.tax-value').textContent = `$${tax.toFixed(2)}`;
    const total = subtotal + tax;
    document.querySelector('.total-value').textContent = `$${total.toFixed(2)}`;
    
    // add event listeners to cart items
    attachCartItemEvents();
}

function attachCartItemEvents() {
    // quantity change events
    document.querySelectorAll('.item-quantity').forEach(input => {
        input.addEventListener('change', function() {
            const cartItem = this.closest('.cart-item');
            const productId = cartItem.dataset.productId;
            const quantity = parseInt(this.value, 10);
            
            if (quantity < 1) {
                this.value = 1;
                cartManager.updateCartItem(productId, 1);
            } else {
                cartManager.updateCartItem(productId, quantity);
            }
            
            renderCartItems();
        });
    });
    
    // increase quantity
    document.querySelectorAll('.increase-qty').forEach(button => {
        button.addEventListener('click', function() {
            const cartItem = this.closest('.cart-item');
            const productId = cartItem.dataset.productId;
            const input = cartItem.querySelector('.item-quantity');
            const quantity = parseInt(input.value, 10) + 1;
            
            cartManager.updateCartItem(productId, quantity);
            renderCartItems();
        });
    });
    
    // decrease quantity
    document.querySelectorAll('.decrease-qty').forEach(button => {
        button.addEventListener('click', function() {
            const cartItem = this.closest('.cart-item');
            const productId = cartItem.dataset.productId;
            const input = cartItem.querySelector('.item-quantity');
            const quantity = Math.max(1, parseInt(input.value, 10) - 1);
            
            cartManager.updateCartItem(productId, quantity);
            renderCartItems();
        });
    });
    
    // remove item
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            const cartItem = this.closest('.cart-item');
            const productId = cartItem.dataset.productId;
            
            cartManager.removeFromCart(productId);
            renderCartItems();
        });
    });
} 