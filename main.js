// State global
let currentUser = null;
let products = [];

// DOM Elements
const root = document.getElementById('root');
const splash = document.getElementById('splash');
const appContainer = document.getElementById('app');

// Fungsi render utama
function renderApp() {
    if (!currentUser) {
        renderAuth();
    } else {
        // Cek role admin (bisa disimpan di Firestore / custom claims)
        checkUserRoleAndRender();
    }
}

async function checkUserRoleAndRender() {
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    const isAdmin = userDoc.exists && userDoc.data().role === 'admin';
    if (isAdmin) {
        renderAdminPanel();
    } else {
        renderUserShop();
    }
}

// Halaman Login/Register elegan
function renderAuth() {
    root.innerHTML = `
        <div class="auth-card" style="animation: fadeUp 0.5s ease;">
            <div class="logo" style="font-size:2rem; text-align:center;">Elysian</div>
            <h3 style="margin:1rem 0 0.5rem; font-weight:500;">Selamat datang</h3>
            <input type="email" id="loginEmail" placeholder="Email" style="margin-bottom:0.8rem;">
            <input type="password" id="loginPassword" placeholder="Password">
            <button id="loginBtn" class="btn-primary" style="margin:1rem 0 0.5rem;">Masuk</button>
            <p style="font-size:0.8rem;">Belum punya akun? <button id="showRegisterBtn" style="background:none; border:none; color:#b47c48; cursor:pointer;">Daftar</button></p>
            <div id="authMessage" style="color:#b85c00; margin-top:0.8rem;"></div>
        </div>
    `;
    document.getElementById('loginBtn').onclick = async () => {
        const email = document.getElementById('loginEmail').value;
        const pass = document.getElementById('loginPassword').value;
        try {
            await auth.signInWithEmailAndPassword(email, pass);
        } catch (err) {
            document.getElementById('authMessage').innerText = err.message;
        }
    };
    document.getElementById('showRegisterBtn').onclick = () => {
        root.innerHTML = `
            <div class="auth-card">
                <div class="logo" style="font-size:2rem;">Daftar</div>
                <input id="regEmail" placeholder="Email"><br>
                <input id="regPass" type="password" placeholder="Password"><br>
                <input id="regName" placeholder="Nama Lengkap">
                <button id="registerBtn" class="btn-primary" style="margin-top:1rem;">Buat Akun</button>
                <p><button id="backLogin" style="background:none; border:none; color:#b47c48;">Kembali ke Login</button></p>
                <div id="regMessage"></div>
            </div>
        `;
        document.getElementById('registerBtn').onclick = async () => {
            const email = document.getElementById('regEmail').value;
            const pass = document.getElementById('regPass').value;
            const name = document.getElementById('regName').value;
            try {
                const cred = await auth.createUserWithEmailAndPassword(email, pass);
                // simpan user biasa (bukan admin)
                await db.collection('users').doc(cred.user.uid).set({ name, email, role: 'user' });
            } catch (err) {
                document.getElementById('regMessage').innerText = err.message;
            }
        };
        document.getElementById('backLogin').onclick = () => renderAuth();
    };
}

// Tampilan User (Toko)
function renderUserShop() {
    root.innerHTML = `
        <div class="navbar">
            <div class="logo">Elysian</div>
            <div class="nav-links">
                <span>Halo, ${currentUser.email?.split('@')[0]}</span>
                <button id="logoutBtn" class="btn-outline"><i class="fas fa-sign-out-alt"></i> Keluar</button>
            </div>
        </div>
        <div style="padding: 1rem 2rem 0; max-width:1300px; margin:auto;">
            <h2 style="font-weight:500; font-family:Playfair Display;">Koleksi Istimewa</h2>
            <p style="color:#7b5a3e;">Keindahan dalam setiap detail</p>
        </div>
        <div id="productListUser" class="products-grid"></div>
    `;
    document.getElementById('logoutBtn').onclick = () => auth.signOut();
    loadProductsAndRenderUser();
}

async function loadProductsAndRenderUser() {
    const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
    products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const container = document.getElementById('productListUser');
    if (!container) return;
    if (products.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:3rem;">✨ Produk akan segera hadir ✨</div>';
        return;
    }
    container.innerHTML = products.map(p => `
        <div class="product-card">
            <div class="product-img"><i class="fas fa-box-open"></i></div>
            <div class="product-info">
                <div class="product-title">${p.name || 'Nama Produk'}</div>
                <div class="product-price">Rp ${formatRupiah(p.price)}</div>
                <p style="font-size:0.8rem; color:#846b53;">${p.description?.substring(0,60) || ''}</p>
                <button class="btn-primary" onclick="alert('Fitur keranjang demo: ${p.name} ditambahkan')">Beli Sekarang</button>
            </div>
        </div>
    `).join('');
}

// Admin Panel (CRUD Produk)
function renderAdminPanel() {
    root.innerHTML = `
        <div class="navbar">
            <div class="logo">Admin • Elysian</div>
            <div class="nav-links">
                <span>Admin: ${currentUser.email}</span>
                <button id="logoutAdminBtn" class="btn-outline">Keluar</button>
            </div>
        </div>
        <div class="admin-panel">
            <h3 style="margin-bottom:1rem;"><i class="fas fa-plus-circle"></i> Tambah Produk Baru</h3>
            <div class="form-group"><input id="prodName" placeholder="Nama produk"></div>
            <div class="form-group"><input id="prodPrice" type="number" placeholder="Harga (Rp)"></div>
            <div class="form-group"><textarea id="prodDesc" placeholder="Deskripsi singkat..."></textarea></div>
            <button id="addProductBtn" class="btn-primary" style="width:auto; padding:0.6rem 2rem;">+ Tambah Produk</button>
            
            <hr style="margin: 2rem 0;">
            <h3>Kelola Produk</h3>
            <div id="adminProductList" style="display:flex; flex-direction:column; gap:0.8rem; margin-top:1rem;"></div>
        </div>
    `;
    document.getElementById('logoutAdminBtn').onclick = () => auth.signOut();
    document.getElementById('addProductBtn').onclick = addNewProduct;
    loadAdminProducts();
}

async function addNewProduct() {
    const name = document.getElementById('prodName').value;
    const price = Number(document.getElementById('prodPrice').value);
    const description = document.getElementById('prodDesc').value;
    if (!name || !price) {
        alert("Nama dan harga wajib diisi");
        return;
    }
    await db.collection('products').add({
        name, price, description, createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('prodName').value = '';
    document.getElementById('prodPrice').value = '';
    document.getElementById('prodDesc').value = '';
    loadAdminProducts();
}

async function loadAdminProducts() {
    const snap = await db.collection('products').orderBy('createdAt', 'desc').get();
    const prods = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const container = document.getElementById('adminProductList');
    if (!container) return;
    if (prods.length === 0) {
        container.innerHTML = '<p>Belum ada produk. Tambahkan sekarang.</p>';
        return;
    }
    container.innerHTML = prods.map(p => `
        <div style="background:#f9f6f2; padding:1rem; border-radius:20px; display:flex; justify-content:space-between; align-items:center;">
            <div><strong>${p.name}</strong> - Rp ${formatRupiah(p.price)}<br><small>${p.description?.slice(0,50)}</small></div>
            <button class="deleteBtn" data-id="${p.id}" style="background:#d9c2aa; border:none; padding:0.4rem 1rem; border-radius:40px; cursor:pointer;">Hapus</button>
        </div>
    `).join('');
    // event hapus
    document.querySelectorAll('.deleteBtn').forEach(btn => {
        btn.onclick = async (e) => {
            const id = btn.getAttribute('data-id');
            await db.collection('products').doc(id).delete();
            loadAdminProducts();
        };
    });
}

function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID').format(angka);
}

// Auth state listener + Splash screen hilang setelah auth ready + fade
auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    // Minimal splash tampil 1.2 detik untuk animasi smooth
    setTimeout(() => {
        if (splash) {
            splash.style.opacity = '0';
            splash.style.visibility = 'hidden';
            appContainer.classList.remove('hidden');
            appContainer.classList.add('visible');
        }
        renderApp();
    }, 1200);
});

// Inisialisasi awal (sembunyikan app dulu)
appContainer.classList.add('hidden');