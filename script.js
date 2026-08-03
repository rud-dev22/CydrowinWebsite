const parallaxDisabledQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
);
const compactParallaxQuery = window.matchMedia(
    "(hover: none), (pointer: coarse), (max-width: 900px)"
);

function shouldUseParallax() {
    return !parallaxDisabledQuery.matches;
}

function addMediaQueryListener(mediaQuery, listener) {
    if (typeof mediaQuery.addEventListener === "function") {
        mediaQuery.addEventListener("change", listener);
    } else if (typeof mediaQuery.addListener === "function") {
        mediaQuery.addListener(listener);
    }
}

function createRafScheduler(callback) {
    let frameId = null;

    return function scheduleCallback() {
        if (frameId !== null) return;

        frameId = window.requestAnimationFrame(() => {
            frameId = null;
            callback();
        });
    };
}

// hero

const pageHeroParallaxStrength = 0.120123456789;
const pageHeroParallaxLimit = 70;
const pageHeroCompactParallaxStrength = 0.08;
const pageHeroCompactParallaxLimit = 46;
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
    if (!shouldUseParallax()) {
        pageHeroes.forEach(({ element }) => {
            element.style.removeProperty("--hero-parallax-y");
        });
        return;
    }

    pageHeroes.forEach(({ element }) => {
        const strength = compactParallaxQuery.matches
            ? pageHeroCompactParallaxStrength
            : pageHeroParallaxStrength;
        const limit = compactParallaxQuery.matches
            ? pageHeroCompactParallaxLimit
            : pageHeroParallaxLimit;
        const rect = element.getBoundingClientRect();
        const offset = rect.top * strength;
        const clampedOffset = Math.max(-limit, Math.min(limit, offset));

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

const schedulePageHeroes = createRafScheduler(updatePageHeroes);

window.addEventListener("load", updatePageHeroes);
window.addEventListener("resize", schedulePageHeroes);

if (document.fonts) {
    document.fonts.ready.then(updatePageHeroes);
}

// about

const about = document.querySelector(".about");
const aboutParallaxStrength = 0.120123456789;
const aboutParallaxLimit = 70;
const aboutCompactParallaxStrength = 0.08;
const aboutCompactParallaxLimit = 46;

function updateAboutParallax() {
    if (!about) return;

    if (!shouldUseParallax()) {
        about.style.removeProperty("--about-parallax-y");
        return;
    }

    const strength = compactParallaxQuery.matches
        ? aboutCompactParallaxStrength
        : aboutParallaxStrength;
    const limit = compactParallaxQuery.matches
        ? aboutCompactParallaxLimit
        : aboutParallaxLimit;
    const rect = about.getBoundingClientRect();
    const offset = rect.top * strength;
    const clampedOffset = Math.max(-limit, Math.min(limit, offset));

    about.style.setProperty("--about-parallax-y", `${clampedOffset.toFixed(2)}px`);
}

// product page

const productPageMain = document.querySelector(".product-page main");
const productParallaxStrength = 0.240123456789;
const productParallaxLimit = 480;
const productCompactParallaxStrength = 0.12;
const productCompactParallaxLimit = 140;

function updateProductParallax() {
    if (!productPageMain) return;

    if (!shouldUseParallax()) {
        productPageMain.style.removeProperty("--product-parallax-y");
        return;
    }

    const strength = compactParallaxQuery.matches
        ? productCompactParallaxStrength
        : productParallaxStrength;
    const limit = compactParallaxQuery.matches
        ? productCompactParallaxLimit
        : productParallaxLimit;
    const offset = Math.min(limit, window.scrollY * strength);
    productPageMain.style.setProperty("--product-parallax-y", `${offset.toFixed(2)}px`);
}

function updateParallaxEffects() {
    updatePageHeroParallax();
    updateAboutParallax();
    updateProductParallax();
}

const scheduleParallaxEffects = createRafScheduler(updateParallaxEffects);

function scheduleParallaxEffectsWhenEnabled() {
    if (shouldUseParallax()) {
        scheduleParallaxEffects();
    }
}

window.addEventListener("load", updateParallaxEffects);
window.addEventListener("resize", scheduleParallaxEffectsWhenEnabled);
window.addEventListener("scroll", scheduleParallaxEffectsWhenEnabled, { passive: true });
addMediaQueryListener(parallaxDisabledQuery, updateParallaxEffects);
addMediaQueryListener(compactParallaxQuery, updateParallaxEffects);

// gallery

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

const scheduleRevealPassedElements = createRafScheduler(revealPassedElements);

window.addEventListener("load", revealPassedElements);

if (!("IntersectionObserver" in window)) {
    window.addEventListener("scroll", scheduleRevealPassedElements, { passive: true });
}

// food recommendations

const foodLists = Array.from(document.querySelectorAll(".food-list"));
const foodRevealDelay = 440;
const foodRevealDuration = 650;
const foodRevealRowTolerance = 8;
const foodRevealStates = foodLists
    .map((list) => ({
        list,
        items: Array.from(list.querySelectorAll(".food")),
        isRevealing: false
    }))
    .filter(({ items }) => items.length > 0);
let foodRevealFrame = null;
let foodRevealObserver = null;
let foodRevealReady = false;

function revealFoodItems(elements, shouldAnimate = false) {
    elements.forEach((element, index) => {
        element.style.setProperty("--food-reveal-delay", `${index * foodRevealDelay}ms`);
        element.classList.add("food-visible");

        if (foodRevealObserver) {
            foodRevealObserver.unobserve(element);
        }

        if (!shouldAnimate) {
            element.style.removeProperty("--food-reveal-delay");
        }
    });
}

function getNextFoodRevealRow(state) {
    const firstHiddenIndex = state.items.findIndex((element) => !element.classList.contains("food-visible"));

    if (firstHiddenIndex === -1) return [];

    const firstHiddenItem = state.items[firstHiddenIndex];
    const rowTop = firstHiddenItem.offsetTop;
    const row = [];

    for (let index = firstHiddenIndex; index < state.items.length; index += 1) {
        const element = state.items[index];

        if (Math.abs(element.offsetTop - rowTop) > foodRevealRowTolerance) {
            break;
        }

        row.push(element);
    }

    return row;
}

function getFoodRevealRowPosition(row) {
    if (!row.length) return "complete";

    const rects = row.map((element) => element.getBoundingClientRect());
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const top = Math.min(...rects.map((rect) => rect.top));
    const right = Math.max(...rects.map((rect) => rect.right));
    const bottom = Math.max(...rects.map((rect) => rect.bottom));
    const left = Math.min(...rects.map((rect) => rect.left));

    if (bottom <= 0) return "past";

    return right > 0
        && left < viewportWidth
        && top < viewportHeight
        ? "visible"
        : "future";
}

function revealFoodRow(state, row) {
    state.isRevealing = true;
    revealFoodItems(row, true);

    const rowRevealTime = ((row.length - 1) * foodRevealDelay) + foodRevealDuration;

    window.setTimeout(() => {
        state.isRevealing = false;
        attemptFoodReveal(state);
    }, rowRevealTime);
}

function attemptFoodReveal(state) {
    if (state.isRevealing) return;

    const nextRow = getNextFoodRevealRow(state);
    const rowPosition = getFoodRevealRowPosition(nextRow);

    if (rowPosition === "complete") return;

    if (rowPosition === "past") {
        revealFoodItems(nextRow, false);
        attemptFoodReveal(state);
        return;
    }

    if (rowPosition !== "visible") return;

    revealFoodRow(state, nextRow);
}

function flushFoodRevealAttempts() {
    foodRevealFrame = null;
    foodRevealStates.forEach(attemptFoodReveal);
}

function scheduleFoodRevealAttempt() {
    if (!foodRevealReady) return;
    if (foodRevealFrame !== null) return;

    foodRevealFrame = window.requestAnimationFrame(flushFoodRevealAttempts);
}

if (foodRevealStates.length) {
    foodRevealStates.forEach(({ list }) => {
        list.classList.add("food-list--revealing");
    });

    const prefersReducedFoodMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedFoodMotion) {
        foodRevealStates.forEach(({ items }) => revealFoodItems(items, false));
    } else {
        if ("IntersectionObserver" in window) {
            foodRevealObserver = new IntersectionObserver((entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    scheduleFoodRevealAttempt();
                }
            }, {
                threshold: 0.01
            });

            foodRevealStates.forEach(({ items }) => {
                items.forEach((element) => foodRevealObserver.observe(element));
            });
        } else {
            window.addEventListener("scroll", scheduleFoodRevealAttempt, { passive: true });
        }

        window.addEventListener("resize", scheduleFoodRevealAttempt);

        window.requestAnimationFrame(() => {
            foodRevealStates.forEach(({ list }) => {
                list.classList.add("food-list--reveal-ready");
            });

            foodRevealReady = true;
            scheduleFoodRevealAttempt();
        });
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
