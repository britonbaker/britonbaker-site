// ============================================
// SIMPLE LANDING - BLACK SCREEN, WHITE CIRCLE
// ============================================

const canvas = document.getElementById('canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ============================================
// WHITE CIRCLE
// ============================================

const circleGeometry = new THREE.CircleGeometry(2, 64);
const circleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const circle = new THREE.Mesh(circleGeometry, circleMaterial);
circle.position.set(0, 0, 0);
scene.add(circle);

// ============================================
// "ENTER" TEXT
// ============================================

function createTextSprite(text) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 512;
  canvas.height = 128;

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 60px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(4, 1, 1);
  return sprite;
}

const enterText = createTextSprite('enter');
enterText.position.set(0, 0, 0.1);
scene.add(enterText);

// ============================================
// FLOATING ANIMATION
// ============================================

let time = 0;
let isAnimating = false;
let hasTransitioned = false;

function animate() {
  requestAnimationFrame(animate);

  if (hasTransitioned) return;

  time += 0.016;

  // Gentle floating motion (only when not transitioning)
  if (!isAnimating) {
    circle.position.y = Math.sin(time * 0.8) * 0.15;
    enterText.position.y = circle.position.y;
  }

  renderer.render(scene, camera);
}

animate();

// ============================================
// CLICK TRANSITION (Enter screen)
// ============================================

function triggerTransition() {
  if (isAnimating || hasTransitioned) return;
  isAnimating = true;

  const cardsSection = document.querySelector('.cards-section');
  const cards = document.querySelectorAll('.card');

  // Timeline for the transition
  const tl = gsap.timeline();

  // Animate circle scale and text fade
  tl.to(circle.scale, {
    x: 50,
    y: 50,
    z: 1,
    duration: 0.6,
    ease: 'power2.in',
    onUpdate: () => renderer.render(scene, camera)
  }, 0);

  // Fade out the enter text
  tl.to(enterText.material, {
    opacity: 0,
    duration: 0.3,
    ease: 'power2.in',
    onUpdate: () => renderer.render(scene, camera)
  }, 0);

  // Move camera forward for zoom effect
  tl.to(camera.position, {
    z: 5,
    duration: 0.6,
    ease: 'power2.in',
    onUpdate: () => renderer.render(scene, camera)
  }, 0);

  // After circle expands, show the cards section
  tl.call(() => {
    hasTransitioned = true;
    cardsSection.classList.add('visible');
    document.body.style.cursor = 'default';
  }, [], 0.5);

  // Fade in cards with stagger
  tl.to(cards, {
    opacity: 1,
    y: 0,
    duration: 0.5,
    stagger: 0.1,
    ease: 'power2.out'
  }, 0.6);
}

// Click anywhere to trigger enter transition
document.addEventListener('click', (e) => {
  // Don't trigger enter transition if clicking on cards
  if (e.target.closest('.card')) return;
  triggerTransition();
});

// Also trigger on Enter key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !hasTransitioned) triggerTransition();
});

// ============================================
// CARD SLOT ANIMATION
// ============================================

let cardInserted = false;

function insertCard(clickedCard) {
  if (cardInserted) return;
  cardInserted = true;

  const cards = document.querySelectorAll('.card');
  const slotContainer = document.querySelector('.slot-container');
  const slotBottom = document.querySelector('.slot-bar.bottom');
  const clickedIndex = Number(clickedCard.dataset.index);

  // Get positions
  const slotRect = slotBottom.getBoundingClientRect();
  const cardRect = clickedCard.getBoundingClientRect();

  // Calculate target positions
  const targetLeft = slotRect.left + slotRect.width / 2 - cardRect.width / 2;
  const targetTop = slotRect.top - 40; // Card bottom overlaps the slot bars

  const tl = gsap.timeline();

  // Step 1: Fade in the slot
  tl.to(slotContainer, {
    opacity: 1,
    duration: 0.3,
    ease: 'power2.out'
  }, 0);

  // Step 2: Slide other cards away (compare by data-index, not DOM order)
  cards.forEach((card) => {
    const cardIndex = Number(card.dataset.index);
    if (cardIndex !== clickedIndex) {
      const direction = cardIndex < clickedIndex ? -1 : 1;
      tl.to(card, {
        x: direction * (window.innerWidth / 2 + 200),
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in'
      }, 0.1);
    }
  });

  // Set up fixed positioning - capture current position first
  const startTop = cardRect.top;
  const startLeft = cardRect.left;

  clickedCard.classList.add('inserting');
  clickedCard.classList.add('selected');

  // Set initial fixed position
  clickedCard.style.top = startTop + 'px';
  clickedCard.style.left = startLeft + 'px';
  clickedCard.style.margin = '0';

  // STEP 1: Move card to center above the slot
  tl.to(clickedCard, {
    top: slotRect.top - cardRect.height - 20,
    left: targetLeft,
    duration: 0.4,
    ease: 'power2.out'
  }, 0.3);

  // STEP 2: Drop straight down into the slot (starts after step 1 finishes)
  tl.to(clickedCard, {
    top: targetTop,
    duration: 0.45,
    ease: 'power2.in'
  }, 0.85);

  // Trigger speed lines on impact
  const speedLines = document.querySelector('.speed-lines');
  tl.call(() => {
    speedLines.classList.add('active');
  }, [], 1.28);

  // Tiny settle bounce
  tl.to(clickedCard, {
    top: targetTop + 3,
    duration: 0.06,
    ease: 'power1.out'
  }, 1.3);

  tl.to(clickedCard, {
    top: targetTop,
    duration: 0.06,
    ease: 'power1.in'
  }, 1.36);

  // After slot animation, move card and slot up together
  // NOTE: Card stays in cardsContainer (DOM unchanged), just animated with fixed positioning
  const backButton = document.querySelector('.back-button');
  const gameContent = document.querySelector('.game-content');
  const slotVoid = document.querySelector('.slot-void');

  const finalTop = 60;
  const cardFinalTop = finalTop - 40; // Same offset as targetTop relative to slot

  // Animate card, slot, and void up together (no DOM moves!)
  tl.to(clickedCard, {
    top: cardFinalTop,
    duration: 0.5,
    ease: 'power2.out'
  }, 1.5);

  tl.to(slotContainer, {
    top: finalTop,
    duration: 0.5,
    ease: 'power2.out'
  }, 1.5);

  tl.to(slotVoid, {
    top: finalTop + 4,
    duration: 0.5,
    ease: 'power2.out'
  }, 1.5);

  // Show back button and game content
  tl.call(() => {
    backButton.classList.add('visible');
    gameContent.classList.add('visible');
  }, [], 2.0);
}

// Back button handler
let isGoingBack = false;

function goBack() {
  if (isGoingBack) return;
  isGoingBack = true;

  const slotContainer = document.querySelector('.slot-container');
  const speedLines = document.querySelector('.speed-lines');
  const backButton = document.querySelector('.back-button');
  const gameContent = document.querySelector('.game-content');
  const slotVoid = document.querySelector('.slot-void');
  const cards = document.querySelectorAll('.card');

  // Find the selected card (it has the 'selected' class)
  const selectedCard = document.querySelector('.card.selected');
  if (!selectedCard) {
    isGoingBack = false;
    return;
  }

  const selectedIndex = Number(selectedCard.dataset.index);

  // Original positions
  const originalSlotTop = window.innerHeight / 2 + 184;
  const originalCardTop = originalSlotTop - 40;

  const tl = gsap.timeline();

  // Step 1: Fade out back button and game content
  tl.to([backButton, gameContent], {
    opacity: 0,
    duration: 0.25,
    ease: 'power2.in',
    onComplete: () => {
      backButton.classList.remove('visible');
      gameContent.classList.remove('visible');
    }
  }, 0);

  // Step 2: Move card, slot, and void back down to center
  tl.to(selectedCard, {
    top: originalCardTop,
    duration: 0.4,
    ease: 'power2.inOut'
  }, 0.2);

  tl.to(slotContainer, {
    top: originalSlotTop,
    duration: 0.4,
    ease: 'power2.inOut'
  }, 0.2);

  tl.to(slotVoid, {
    top: originalSlotTop + 4,
    duration: 0.4,
    ease: 'power2.inOut'
  }, 0.2);

  // Step 3: Card rises up out of slot
  tl.to(selectedCard, {
    top: originalCardTop - 100,
    duration: 0.3,
    ease: 'power2.out'
  }, 0.6);

  // Step 4: Fade out slot
  tl.to(slotContainer, {
    opacity: 0,
    duration: 0.3,
    ease: 'power2.in'
  }, 0.7);

  // Step 5: Reset selected card to flow and slide other cards back in
  tl.call(() => {
    // Reset selected card to normal flow
    selectedCard.classList.remove('inserting', 'selected');
    selectedCard.style.cssText = '';
    gsap.set(selectedCard, { clearProps: 'all' });
    gsap.set(selectedCard, { opacity: 1, y: 0 });

    // Slide other cards back in
    cards.forEach(card => {
      const idx = Number(card.dataset.index);
      if (idx !== selectedIndex) {
        gsap.to(card, {
          x: 0,
          opacity: 1,
          duration: 0.4,
          ease: 'power2.out'
        });
      }
    });
  }, [], 0.9);

  // Step 6: Final cleanup
  tl.call(() => {
    // Reset slot container
    slotContainer.style.cssText = '';
    gsap.set(slotContainer, { clearProps: 'all' });
    gsap.set(slotContainer, { opacity: 0 });

    // Reset void
    slotVoid.style.cssText = '';
    gsap.set(slotVoid, { clearProps: 'all' });

    // Reset speed lines
    speedLines.classList.remove('active');

    // Reset back button/game content opacity for next time
    gsap.set([backButton, gameContent], { clearProps: 'opacity' });

    // Allow new card insertion
    cardInserted = false;
    isGoingBack = false;
  }, [], 1.3);
}

// Add click listeners to cards after DOM loads
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      insertCard(card);
    });
  });

  // Back button listener
  const backButton = document.querySelector('.back-button');
  backButton.addEventListener('click', (e) => {
    e.stopPropagation();
    goBack();
  });
});

// ============================================
// RESIZE
// ============================================

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
