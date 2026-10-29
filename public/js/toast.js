// Toast notification system
const Toast = {
    show(message, type = 'info', duration = 3500) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = 'position:fixed;top:1.5rem;right:1.5rem;z-index:9999;display:flex;flex-direction:column;gap:0.75rem;pointer-events:none;';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const colors = {
            success: 'background:linear-gradient(135deg,#22c55e,#16a34a)',
            error: 'background:linear-gradient(135deg,#ef4444,#dc2626)',
            warning: 'background:linear-gradient(135deg,#f59e0b,#d97706)',
            info: 'background:linear-gradient(135deg,#6366f1,#8b5cf6)'
        };
        toast.style.cssText = `
            ${colors[type] || colors.info};
            color:white;
            padding:1rem 1.5rem;
            border-radius:14px;
            box-shadow:0 8px 30px rgba(0,0,0,0.2);
            font-family:'Inter',sans-serif;
            font-size:0.9rem;
            font-weight:500;
            display:flex;
            align-items:center;
            gap:0.75rem;
            pointer-events:all;
            animation:toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
            max-width:360px;
            min-width:200px;
            cursor:pointer;
        `;
        toast.innerHTML = `<span style="font-size:1.1rem">${icons[type] || icons.info}</span><span>${message}</span>`;
        toast.addEventListener('click', () => {
            toast.style.animation = 'toastOut 0.3s ease-in both';
            setTimeout(() => toast.remove(), 300);
        });
        container.appendChild(toast);
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'toastOut 0.3s ease-in both';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    },
    success: (msg, dur) => Toast.show(msg, 'success', dur),
    error: (msg, dur) => Toast.show(msg, 'error', dur),
    warning: (msg, dur) => Toast.show(msg, 'warning', dur),
    info: (msg, dur) => Toast.show(msg, 'info', dur),
};

// Add CSS animations
const toastStyle = document.createElement('style');
toastStyle.textContent = `
@keyframes toastIn { from { opacity:0; transform:translateX(100%) scale(0.8); } to { opacity:1; transform:translateX(0) scale(1); } }
@keyframes toastOut { from { opacity:1; transform:translateX(0) scale(1); } to { opacity:0; transform:translateX(100%) scale(0.8); } }
`;
document.head.appendChild(toastStyle);

