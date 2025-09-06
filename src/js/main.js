// 1. Service Workerの登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

// 2. ページ読み込み完了後にUI関連のスクリプトを実行
window.addEventListener('load', () => {
    
    // 2-1. タブスクロール機能のセットアップ
    function setupTabScroll(containerId, leftArrowId, rightArrowId) {
        const scrollContainer = document.getElementById(containerId);
        const leftArrow = document.getElementById(leftArrowId);
        const rightArrow = document.getElementById(rightArrowId);
        if (!scrollContainer || !leftArrow || !rightArrow) return;
        
        function updateArrows() {
            if (scrollContainer.scrollWidth <= scrollContainer.clientWidth) {
                if(leftArrow) leftArrow.classList.add('hidden');
                if(rightArrow) rightArrow.classList.add('hidden');
                return;
            }
            const scrollLeft = scrollContainer.scrollLeft;
            const scrollWidth = scrollContainer.scrollWidth;
            const clientWidth = scrollContainer.clientWidth;
            const tolerance = 1;
            if(leftArrow) leftArrow.classList.toggle('hidden', scrollLeft <= 0);
            if(rightArrow) rightArrow.classList.toggle('hidden', scrollLeft + clientWidth >= scrollWidth - tolerance);
        }

        if(leftArrow) leftArrow.addEventListener('click', () => { scrollContainer.scrollBy({ left: -200, behavior: 'smooth' }); });
        if(rightArrow) rightArrow.addEventListener('click', () => { scrollContainer.scrollBy({ left: 200, behavior: 'smooth' }); });
        
        scrollContainer.addEventListener('scroll', updateArrows);
        window.addEventListener('resize', updateArrows);
        setTimeout(updateArrows, 100);
    }
    setupTabScroll('scroll-container-mobile', 'scroll-left-arrow-mobile', 'scroll-right-arrow-mobile');
    setupTabScroll('scroll-container-desktop', 'scroll-left-arrow-desktop', 'scroll-right-arrow-desktop');

    // 2-2. スケジュール画像保存機能
    const captureButton = document.getElementById('capture-schedule-btn');
    const targetElement = document.getElementById('schedule-capture-area');
    const confirmDialog = document.getElementById('confirm-dialog');
    const confirmYesBtn = document.getElementById('confirm-yes-btn');
    const confirmNoBtn = document.getElementById('confirm-no-btn');

    if (captureButton && targetElement && confirmDialog) {
        captureButton.addEventListener('click', () => {
            confirmDialog.classList.remove('hidden');
        });
        
        const closeDialog = () => confirmDialog.classList.add('hidden');
        confirmNoBtn.addEventListener('click', closeDialog);
        confirmDialog.addEventListener('click', (event) => {
            if (event.target === confirmDialog) {
                closeDialog();
            }
        });

        confirmYesBtn.addEventListener('click', () => {
            closeDialog();
            const originalButtonContent = captureButton.innerHTML;
            captureButton.innerHTML = '...';
            captureButton.disabled = true;
            targetElement.classList.add('screenshot-mode');
            
            setTimeout(async () => {
                try {
                    await document.fonts.ready;
                } catch (error) {
                    console.error('Font loading error:', error);
                }
                const originalScrollY = window.scrollY;
                window.scrollTo(0, 0);
                
                html2canvas(targetElement, {
                    useCORS: true,
                    backgroundColor: null,
                    scale: 2,
                    allowTaint: true,
                    ignoreElements: (element) => element.id === 'capture-schedule-btn'
                }).then(canvas => {
                    const link = document.createElement('a');
                    link.href = canvas.toDataURL('image/png');
                    link.download = 'schedule.png';
                    link.click();
                }).finally(() => {
                    window.scrollTo(0, originalScrollY);
                    captureButton.innerHTML = originalButtonContent;
                    captureButton.disabled = false;
                    targetElement.classList.remove('screenshot-mode');
                });
            }, 100);
        });
    }

    // 2-3. ページ内目次（ナビゲーション）機能
    const navContainer = document.getElementById('page-nav-container');
    const navToggle = document.getElementById('page-nav-toggle');
    const navMenu = document.getElementById('page-nav-menu');

    if (navContainer && navToggle && navMenu) {
        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navContainer.classList.toggle('menu-open');
        });

        navMenu.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;

            e.preventDefault();
            const targetId = link.getAttribute('href');
            
            if (targetId === '#top') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
            navContainer.classList.remove('menu-open');
        });

        document.addEventListener('click', (e) => {
            if (!navContainer.contains(e.target)) {
                navContainer.classList.remove('menu-open');
            }
        });
    }
});
