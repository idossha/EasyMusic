// Simple script for documentation page interactions

document.addEventListener('DOMContentLoaded', function() {
    // OS Detection and Download Link Management
    function detectOS() {
        const userAgent = navigator.userAgent.toLowerCase();
        const platform = navigator.platform.toLowerCase();

        if (userAgent.includes('win')) {
            return 'windows';
        } else if (userAgent.includes('mac') || platform.includes('mac')) {
            return 'macos';
        } else if (userAgent.includes('linux') || platform.includes('linux')) {
            return 'linux';
        } else {
            return 'unknown';
        }
    }

    function updateDownloadLinks() {
        const os = detectOS();
        const mainDownloadBtn = document.getElementById('mainDownloadBtn');
        const downloadText = document.getElementById('downloadText');
        const downloadOptions = document.querySelectorAll('.download-option');

        // Update main download button text based on detected OS
        let osName = 'EasyMusic';
        switch (os) {
            case 'windows':
                osName = 'Download for Windows';
                break;
            case 'macos':
                osName = 'Download for macOS';
                break;
            case 'linux':
                osName = 'Download for Linux';
                break;
            default:
                osName = 'Download EasyMusic';
        }
        downloadText.textContent = osName;

        // Highlight the detected OS option
        downloadOptions.forEach(option => {
            if (option.getAttribute('data-os') === os) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });

        // Update download button hrefs to point to latest release assets
        if (os !== 'unknown') {
            const releaseUrls = {
                windows: 'https://github.com/idohaber/EasyMusic/releases/latest/download/EasyMusic%20Setup%200.1.0.exe',
                macos: 'https://github.com/idohaber/EasyMusic/releases/latest/download/EasyMusic-0.1.0.dmg',
                linux: 'https://github.com/idohaber/EasyMusic/releases/latest/download/EasyMusic-0.1.0.AppImage'
            };

            if (releaseUrls[os]) {
                mainDownloadBtn.href = releaseUrls[os];
                downloadOptions.forEach(option => {
                    const optionOs = option.getAttribute('data-os');
                    if (releaseUrls[optionOs]) {
                        option.href = releaseUrls[optionOs];
                    }
                });
            }
        }
    }

    // Initialize download links
    updateDownloadLinks();

    // Add smooth scrolling for any anchor links
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add some subtle animations on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all sections for fade-in animation
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });

    // Add hover effects for feature cards
    const featureCards = document.querySelectorAll('.feature-card, .step-card, .trouble-item');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});