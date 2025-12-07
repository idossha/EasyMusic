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

    async function fetchLatestRelease() {
        try {
            const response = await fetch('https://api.github.com/repos/idohaber/EasyMusic/releases/latest');
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch latest release:', error);
            return null;
        }
    }

    function findDownloadUrl(release, os) {
        if (!release || !release.assets) return null;

        // Define patterns for different OS artefacts
        const patterns = {
            windows: /\.exe$/i,
            macos: /\.dmg$/i,
            linux: /\.(?:AppImage|deb)$/i
        };

        const pattern = patterns[os];
        if (!pattern) return null;

        // Find the matching asset
        const asset = release.assets.find(asset => pattern.test(asset.name));
        return asset ? asset.browser_download_url : null;
    }

    async function updateDownloadLinks(selectedOs = null) {
        const detectedOs = detectOS();
        const os = selectedOs || detectedOs;
        const mainDownloadBtn = document.getElementById('mainDownloadBtn');
        const downloadText = document.getElementById('downloadText');
        const downloadOptions = document.querySelectorAll('.download-option');

        // Update main download button text based on selected/detected OS
        let osName = 'EasyMusic';
        switch (os) {
            case 'windows':
                osName = 'Download for Windows';
                break;
            case 'macos':
                osName = 'Download for macOS (Silicon)';
                break;
            case 'linux':
                osName = 'Download for Linux';
                break;
            default:
                osName = 'Download EasyMusic';
        }
        downloadText.textContent = osName;

        // Highlight the selected/detected OS option
        downloadOptions.forEach(option => {
            if (option.getAttribute('data-os') === os) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });

        // Show loading state
        mainDownloadBtn.style.pointerEvents = 'none';
        mainDownloadBtn.style.opacity = '0.7';

        try {
            // Fetch latest release and set direct download link
            const release = await fetchLatestRelease();
            if (release) {
                const downloadUrl = findDownloadUrl(release, os);
                if (downloadUrl) {
                    mainDownloadBtn.href = downloadUrl;
                    mainDownloadBtn.target = '_blank';
                    console.log(`Download URL set for ${os}: ${downloadUrl}`);
                } else {
                    // Fallback to releases page if specific asset not found
                    mainDownloadBtn.href = 'https://github.com/idohaber/EasyMusic/releases/latest';
                    mainDownloadBtn.target = '_blank';
                    console.warn(`No download URL found for ${os}, falling back to releases page`);
                }
            } else {
                // Fallback to releases page if API fails
                mainDownloadBtn.href = 'https://github.com/idohaber/EasyMusic/releases/latest';
                mainDownloadBtn.target = '_blank';
                console.warn('Failed to fetch release data, falling back to releases page');
            }
        } catch (error) {
            console.error('Error updating download links:', error);
            mainDownloadBtn.href = 'https://github.com/idohaber/EasyMusic/releases/latest';
            mainDownloadBtn.target = '_blank';
        } finally {
            // Restore button state
            mainDownloadBtn.style.pointerEvents = '';
            mainDownloadBtn.style.opacity = '';
        }
    }

    // Initialize download links
    updateDownloadLinks();

    // Add click handlers for OS options (act as switches)
    const downloadOptions = document.querySelectorAll('.download-option');
    downloadOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default link behavior
            const selectedOs = this.getAttribute('data-os');
            updateDownloadLinks(selectedOs);
        });
    });

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

    // Observe all sections for professional reveal (exclude hero and download sections)
    const sections = document.querySelectorAll('.section:not(.hero-section):not(:has(.download-section))');
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