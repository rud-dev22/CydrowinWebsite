// hero

const pageHeroParallaxStrength = 0.120123456789;
const pageHeroParallaxLimit = 70;
const pageHeroes = [".hero", ".heroShop"]
    .map((selector) => {
        const element = document.querySelector(selector);
        const title = element ? element.querySelector("h1") : null;

        return element && title
            ? {
                element,
                title,
                measure: document.createElement("span")
            }
            : null;
    })
    .filter(Boolean);

pageHeroes.forEach(({ measure }) => {
    measure.setAttribute("aria-hidden", "true");
    Object.assign(measure.style, {
        position: "fixed",
        left: "-9999px",
        top: "0",
        visibility: "hidden",
        whiteSpace: "nowrap",
        pointerEvents: "none"
    });
    document.body.appendChild(measure);
});

function updatePageHeroParallax() {
    pageHeroes.forEach(({ element }) => {
        const rect = element.getBoundingClientRect();
        const offset = rect.top * pageHeroParallaxStrength;
        const clampedOffset = Math.max(-pageHeroParallaxLimit, Math.min(pageHeroParallaxLimit, offset));

        element.style.setProperty("--hero-parallax-y", `${clampedOffset.toFixed(2)}px`);
    });
}

function updatePageHeroTitleSize() {
    pageHeroes.forEach(({ element, title, measure }) => {
        element.style.removeProperty("--hero-title-size");

        const heroRect = element.getBoundingClientRect();
        const titleStyle = window.getComputedStyle(title);
        const rootFontSize = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
        const maxSize = parseFloat(titleStyle.fontSize);
        const minSize = Math.max(12, rootFontSize);
        const sidePadding = parseFloat(titleStyle.paddingLeft) + parseFloat(titleStyle.paddingRight);
        const verticalPadding = parseFloat(titleStyle.paddingTop) + parseFloat(titleStyle.paddingBottom);
        const visibleWidth = Math.min(heroRect.width, document.documentElement.clientWidth);
        const availableWidth = Math.max(0, visibleWidth - sidePadding);
        const titleBottom = parseFloat(titleStyle.bottom);
        const availableHeight = Math.max(
            1,
            element.clientHeight
            - verticalPadding
            - (Number.isFinite(titleBottom) ? titleBottom + rootFontSize : rootFontSize * 2)
        );

        measure.textContent = title.textContent;
        measure.style.font = titleStyle.font;
        measure.style.letterSpacing = titleStyle.letterSpacing;

        const textWidth = Math.max(1, measure.getBoundingClientRect().width);
        const titleHeight = Math.max(1, title.scrollHeight);
        const scale = Math.min(1, availableWidth / textWidth, availableHeight / titleHeight);
        const fittedSize = Math.max(minSize, maxSize * scale);

        element.style.setProperty("--hero-title-size", `${fittedSize.toFixed(2)}px`);
    });
}

function updatePageHeroes() {
    updatePageHeroParallax();
    updatePageHeroTitleSize();
}

window.addEventListener("load", updatePageHeroes);
window.addEventListener("resize", updatePageHeroes);
window.addEventListener("scroll", updatePageHeroParallax, { passive: true });

if (document.fonts) {
    document.fonts.ready.then(updatePageHeroes);
}

// about

const about = document.querySelector(".about");
const aboutParallaxStrength = 0.120123456789;
const aboutParallaxLimit = 70;

function updateAboutParallax() {
    if (!about) return;

    const rect = about.getBoundingClientRect();
    const offset = rect.top * aboutParallaxStrength;
    const clampedOffset = Math.max(-aboutParallaxLimit, Math.min(aboutParallaxLimit, offset));

    about.style.setProperty("--about-parallax-y", `${clampedOffset.toFixed(2)}px`);
}

// product page

const productPageMain = document.querySelector(".product-page main");
const productParallaxStrength = 0.240123456789;
const productParallaxLimit = 480;

function updateProductParallax() {
    if (!productPageMain) return;

    const offset = Math.min(productParallaxLimit, window.scrollY * productParallaxStrength);
    productPageMain.style.setProperty("--product-parallax-y", `${offset.toFixed(2)}px`);
}

window.addEventListener("load", updateProductParallax);
window.addEventListener("scroll", updateProductParallax, { passive: true });

// gallery

window.addEventListener("load", updateAboutParallax);
window.addEventListener("scroll", updateAboutParallax);

const revealElements = document.querySelectorAll(".reveal-up");
let revealObserver = null;

function revealElement(element) {
    element.classList.add("visible");

    if (revealObserver) {
        revealObserver.unobserve(element);
    }
}

function revealPassedElements() {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    revealElements.forEach((element) => {
        if (element.classList.contains("visible")) return;

        const rect = element.getBoundingClientRect();

        if (rect.top <= viewportHeight * 0.9 || rect.bottom < 0) {
            revealElement(element);
        }
    });
}

if ("IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                revealElement(entry.target);
            }
        });
    }, {
        threshold: 0.2
    });

    revealElements.forEach((element) => revealObserver.observe(element));
} else {
    revealElements.forEach(revealElement);
}

window.addEventListener("load", revealPassedElements);
window.addEventListener("scroll", revealPassedElements, { passive: true });

// food recommendations

const foodLists = document.querySelectorAll(".food-list");
const foodRevealItems = Array.from(document.querySelectorAll(".food-list .food"));
const pendingFoodRevealItems = new Set();
const foodRevealDelay = 440;
let foodRevealObserver = null;
let foodRevealFrame = null;

function revealFoodItems(elements) {
    elements.forEach((element, index) => {
        element.style.setProperty("--food-reveal-delay", `${index * foodRevealDelay}ms`);
        element.classList.add("food-visible");

        if (foodRevealObserver) {
            foodRevealObserver.unobserve(element);
        }
    });
}

function compareFoodRevealOrder(firstElement, secondElement) {
    return foodRevealItems.indexOf(firstElement) - foodRevealItems.indexOf(secondElement);
}

function isFoodRevealInViewport(element) {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

    return rect.bottom > 0
        && rect.right > 0
        && rect.top < viewportHeight
        && rect.left < viewportWidth;
}

function flushFoodRevealItems() {
    foodRevealFrame = null;

    const visibleItems = Array.from(pendingFoodRevealItems)
        .filter((element) => !element.classList.contains("food-visible"))
        .filter(isFoodRevealInViewport)
        .sort(compareFoodRevealOrder);

    pendingFoodRevealItems.clear();
    revealFoodItems(visibleItems);
}

function queueFoodReveal(element) {
    pendingFoodRevealItems.add(element);

    if (foodRevealFrame === null) {
        foodRevealFrame = window.requestAnimationFrame(flushFoodRevealItems);
    }
}

if (foodRevealItems.length) {
    foodLists.forEach((list) => list.classList.add("food-list--revealing"));

    const prefersReducedFoodMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if ("IntersectionObserver" in window && !prefersReducedFoodMotion) {
        foodRevealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    queueFoodReveal(entry.target);
                }
            });
        }, {
            threshold: 0.2
        });

        foodRevealItems.forEach((element) => foodRevealObserver.observe(element));
    } else {
        revealFoodItems(foodRevealItems);
    }
}

// quick-message

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('contact-form');
    form && form.addEventListener('submit', function (e) {
        e.preventDefault();
        alert('Dziękujemy — wiadomość została wysłana.');
        form.reset();
    });
});

// counter

const numberOfProducts = document.querySelector("input.number");
numberOfProducts.value = 1;

function increment() {
    numberOfProducts.value = Number(numberOfProducts.value) + 1;
}

function decrement() {
    if (Number(numberOfProducts.value) !== 0) {
        numberOfProducts.value = Number(numberOfProducts.value) - 1;
    }
}
