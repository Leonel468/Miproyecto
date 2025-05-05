// Elementos del DOM
const loginIcon = document.getElementById('login-icon');
const cartBtn = document.querySelector('.cart-btn');
const loginModal = document.getElementById('login-modal');
const registerModal = document.getElementById('register-modal');
const cartModal = document.getElementById('cart-modal');
const closeModals = document.querySelectorAll('.close-modal');
const registerLink = document.getElementById('register-link');
const loginLink = document.getElementById('login-link');
const continueShopping = document.getElementById('continue-shopping');
const filterBtns = document.querySelectorAll('.filter-btn');
const productCards = document.querySelectorAll('.product-card');
const addToCartBtns = document.querySelectorAll('.add-to-cart');
const cartCount = document.querySelector('.cart-count');
const cartItems = document.getElementById('cart-items');
const cartTotalAmount = document.getElementById('cart-total-amount');
const checkoutBtn = document.getElementById('checkout-btn');

// Estado global
let cart = [];
let loggedIn = false;

// Usuario por defecto para pruebas
const defaultUser = {
    email: "Leonel@gmail.com",
    password: "1234",
    name: "Oscar Benitez",
    avatar: "imagenes/cliente 3.jpg"
};

// ===== FUNCIONES AUXILIARES =====

// Mostrar/ocultar ventanas modales
function toggleModal(modal, show = true) {
    if (!modal) return;
    modal.style.display = show ? 'block' : 'none';
    document.body.style.overflow = show ? 'hidden' : '';
}

// Mostrar notificaciones temporales
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ===== FLUJO PRINCIPAL SEGÚN DIAGRAMA =====

// 1️ EXPLORACIÓN DEL CATÁLOGO (Navegación libre)
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar filtros de productos
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            productCards.forEach(card => {
                card.style.display = filter === 'all' || card.dataset.category === filter ? 'block' : 'none';
            });
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Inicializar eventos de los modales
    closeModals.forEach(btn =>
        btn.addEventListener('click', () => toggleModal(btn.closest('.modal'), false))
    );

    if (loginIcon) loginIcon.addEventListener('click', () => toggleModal(loginModal));
    if (cartBtn) cartBtn.addEventListener('click', () => toggleModal(cartModal));
    if (continueShopping) continueShopping.addEventListener('click', () => toggleModal(cartModal, false));

    if (registerLink) registerLink.addEventListener('click', e => {
        e.preventDefault();
        toggleModal(loginModal, false);
        toggleModal(registerModal, true);
    });

    if (loginLink) loginLink.addEventListener('click', e => {
        e.preventDefault();
        toggleModal(registerModal, false);
        toggleModal(loginModal, true);
    });
});

// 2️ AGREGAR AL CARRITO Y CONFIRMAR PEDIDO
document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', function() {
        const card = this.closest('.product-card');
        addToCart(card);
    });
});

function addToCart(card) {
    if (!card) {
        console.error('No se encontró el elemento del producto');
        return;
    }
    
    const name = card.querySelector('h3').textContent;
    const image = card.querySelector('img').src;
    const price = parseFloat(card.querySelector('.price').textContent.replace('S/. ', ''));

    // Verificar que los datos sean válidos
    if (!name || !image || isNaN(price)) {
        console.error('Datos del producto inválidos:', { name, image, price });
        return;
    }

    const item = cart.find(p => p.title === name);

    if (item) {
        item.quantity++;
    } else {
        cart.push({ title: name, img: image, price, quantity: 1 });
    }

    updateCartView();
    showNotification(`"${name}" añadido al carrito`);
}

function updateCartView() {
    cartCount.textContent = cart.reduce((sum, p) => sum + p.quantity, 0);
    cartItems.innerHTML = '';

    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">El carrito está vacío</div>';
        cartTotalAmount.textContent = 'S/. 0.00';
        return;
    }

    let total = 0;

    cart.forEach((p, index) => {
        total += p.price * p.quantity;

        const itemHTML = `
            <div class="cart-item">
                <img src="${p.img}" class="cart-item-img" alt="${p.title}">
                <div class="cart-item-details">
                    <div class="cart-item-title">${p.title}</div>
                    <div class="cart-item-price">S/. ${p.price.toFixed(2)}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn decrease" data-index="${index}">-</button>
                        <span class="quantity-value">${p.quantity}</span>
                        <button class="quantity-btn increase" data-index="${index}">+</button>
                        <button class="cart-item-remove" data-index="${index}">🗑️</button>
                    </div>
                </div>
            </div>
        `;

        cartItems.insertAdjacentHTML('beforeend', itemHTML);
    });

    cartTotalAmount.textContent = `S/. ${total.toFixed(2)}`;

    // Asignar acciones a botones
    document.querySelectorAll('.decrease').forEach(btn =>
        btn.addEventListener('click', () => changeQuantity(parseInt(btn.dataset.index), -1))
    );
    document.querySelectorAll('.increase').forEach(btn =>
        btn.addEventListener('click', () => changeQuantity(parseInt(btn.dataset.index), 1))
    );
    document.querySelectorAll('.cart-item-remove').forEach(btn =>
        btn.addEventListener('click', () => removeItem(parseInt(btn.dataset.index)))
    );
}

function changeQuantity(index, change) {
    if (isNaN(index) || !cart[index]) {
        console.error('Índice inválido:', index);
        return;
    }
    
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) {
        removeItem(index);
    } else {
        updateCartView();
    }
}

function removeItem(index) {
    if (isNaN(index) || !cart[index]) {
        console.error('Índice inválido:', index);
        return;
    }
    
    const removed = cart.splice(index, 1)[0];
    updateCartView();
    showNotification(`"${removed.title}" eliminado del carrito`);
}

//  INICIAR SESIÓN / REGISTRO
// Escuchar botón de checkout para verificar si necesita login
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        // Verificar si el carrito está vacío
        if (cart.length === 0) {
            showNotification('El carrito está vacío');
            return;
        }
        
        // Verificar si el usuario está logueado
        if (!loggedIn) {
            // Redirigir al login según el diagrama de flujo
            toggleModal(cartModal, false);
            toggleModal(loginModal, true);
            showNotification('Debes iniciar sesión para finalizar la compra');
            return;
        }
        
        // Si ya está logueado, continuar al checkout
        proceedToCheckout();
    });
}

// Manejo del formulario de login
document.getElementById('login-form').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (email === defaultUser.email && password === defaultUser.password) {
        loggedIn = true;
        toggleModal(loginModal, false);
        showNotification(`Bienvenido, ${defaultUser.name} 👋`);

        // Mostrar perfil de usuario
        updateUserProfile();
        
        // Si venía de un intento de checkout, continuar automáticamente
        if (cart.length > 0) {
            proceedToCheckout();
        }
    } else {
        showNotification('Usuario o contraseña incorrectos');
    }
});

// Manejo del formulario de registro
document.getElementById('register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    showNotification(`¡Registro exitoso, ${name.split(' ')[0]}! Ahora inicia sesión`);
    
    // Cierra el modal de registro y abre el de login
    toggleModal(registerModal, false);
    setTimeout(() => {
        toggleModal(loginModal, true);
    }, 500); // pequeño delay para que no se solapen los modales
});

function updateUserProfile() {
    // Mostrar perfil
    const profile = document.getElementById('user-profile');
    profile.innerHTML = ''; // Limpia contenido anterior
    
    // Crear avatar
    const avatar = document.createElement('img');
    avatar.src = defaultUser.avatar;
    avatar.alt = 'Avatar';
    avatar.id = 'user-avatar';
    avatar.style.width = '35px';
    avatar.style.height = '35px';
    avatar.style.borderRadius = '50%';
    
    // Crear nombre
    const nameSpan = document.createElement('span');
    nameSpan.id = 'user-name';
    nameSpan.textContent = defaultUser.name;
    nameSpan.style.marginLeft = '8px';
    nameSpan.style.color = 'white';
    
    // Crear botón de logout
    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = 'Cerrar sesión';
    logoutBtn.className = 'logout-btn';
    logoutBtn.style.marginLeft = '10px';
    logoutBtn.addEventListener('click', () => {
        loggedIn = false;
        cart = [];
        updateCartView();
        profile.style.display = 'none';
        document.getElementById('login-icon').style.display = 'flex';
        showNotification('Sesión cerrada');
    });
    
    // Insertar al DOM
    profile.appendChild(avatar);
    profile.appendChild(nameSpan);
    profile.appendChild(logoutBtn);
    profile.style.display = 'flex';
    
    // Ocultar icono de login
    document.getElementById('login-icon').style.display = 'none';
}

// 4️⃣ CHECKOUT (MÉTODO DE ENTREGA Y PAGO)
function proceedToCheckout() {
    // Verificar que hay productos en el carrito
    if (cart.length === 0) {
        showNotification('El carrito está vacío');
        return;
    }

    // Verificar si se seleccionó método de pago
    const selectedPayment = document.querySelector('input[name="payment"]:checked');
    if (!selectedPayment) {
        showNotification('Por favor, selecciona un método de pago');
        return;
    }

    // Procesar la orden
    const paymentMethod = selectedPayment.value;
    completeOrder(paymentMethod);
}

// 5️⃣ ENTREGA DEL PEDIDO
function completeOrder(paymentMethod) {
    showNotification(`¡Pedido realizado con éxito! Pago con ${paymentMethod} 🧁`);
    cart = [];
    updateCartView();
    toggleModal(cartModal, false);
}