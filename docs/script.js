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

    // Professional scroll reveal animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -150px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('section-revealed');
            }
        });
    }, observerOptions);

    // Observe all sections for professional reveal (exclude hero only)
    const sections = document.querySelectorAll('.section:not(.hero-section)');
    sections.forEach(section => {
        section.classList.add('section-hidden');
        observer.observe(section);
    });

    // Scroll snap behavior for sections
    const scrollContainer = document.querySelector('.main');
    let isScrolling = false;

    function handleScroll() {
        if (!isScrolling) {
            isScrolling = true;
            setTimeout(() => {
                isScrolling = false;
            }, 100);

            const sections = document.querySelectorAll('.section');
            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;

            sections.forEach((section, index) => {
                const rect = section.getBoundingClientRect();
                const sectionTop = rect.top + scrollY;

                // Trigger reveal when section is in viewport
                if (sectionTop < scrollY + windowHeight * 0.9 && sectionTop + rect.height > scrollY + windowHeight * 0.1) {
                    section.classList.add('section-revealed');
                }
            });
        }
    }

    // Throttle scroll events for better performance
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (!scrollTimeout) {
            scrollTimeout = setTimeout(() => {
                handleScroll();
                updateParallax();
                scrollTimeout = null;
            }, 16); // ~60fps
        }
    });

    // Subtle parallax effect for particles
    function updateParallax() {
        const scrolled = window.scrollY;
        const particles = document.querySelectorAll('.particle');

        particles.forEach((particle, index) => {
            const speed = (index + 1) * 0.1;
            const yPos = -(scrolled * speed);
            particle.style.transform = `translateY(${yPos}px)`;
        });
    }

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