import gsap from 'gsap';

let scrollTriggerRegistered = false;

async function ensureScrollTrigger() {
	if (typeof window === 'undefined') return;
	if (scrollTriggerRegistered) return;
	const { ScrollTrigger } = await import('gsap/ScrollTrigger');
	gsap.registerPlugin(ScrollTrigger);
	scrollTriggerRegistered = true;
}

export function fadeInUp(element: Element, delay: number = 0): gsap.core.Tween {
	return gsap.from(element, {
		y: 30,
		opacity: 0,
		duration: 0.6,
		delay,
		ease: 'power2.out'
	});
}

export function staggerChildren(
	parent: Element,
	selector: string,
	stagger: number = 0.1
): gsap.core.Tween {
	return gsap.from(parent.querySelectorAll(selector), {
		y: 20,
		opacity: 0,
		duration: 0.5,
		stagger,
		ease: 'power2.out'
	});
}

export function imageHoverZoom(
	container: Element,
	img: Element
): () => void {
	const onEnter = () => gsap.to(img, { scale: 1.05, duration: 0.4, ease: 'power2.out' });
	const onLeave = () => gsap.to(img, { scale: 1, duration: 0.4, ease: 'power2.out' });

	container.addEventListener('mouseenter', onEnter);
	container.addEventListener('mouseleave', onLeave);

	return () => {
		container.removeEventListener('mouseenter', onEnter);
		container.removeEventListener('mouseleave', onLeave);
		gsap.killTweensOf(img);
	};
}

export async function scrollRevealGrid(grid: Element): Promise<(() => void) | undefined> {
	if (typeof window === 'undefined') return;
	await ensureScrollTrigger();
	const { ScrollTrigger } = await import('gsap/ScrollTrigger');

	const cards = grid.querySelectorAll('[data-product-card]');
	if (cards.length === 0) return;

	gsap.set(cards, { y: 40, opacity: 0 });

	const tween = gsap.to(cards, {
		y: 0,
		opacity: 1,
		duration: 0.6,
		stagger: 0.08,
		ease: 'power2.out',
		scrollTrigger: {
			trigger: grid,
			start: 'top 85%',
			once: true
		}
	});

	return () => {
		tween.kill();
		ScrollTrigger.getAll()
			.filter((t) => t.trigger === grid)
			.forEach((t) => t.kill());
	};
}

export function cartFlyIn(element: Element): gsap.core.Tween {
	return gsap.from(element, {
		x: 100,
		opacity: 0,
		duration: 0.3,
		ease: 'power2.out'
	});
}

export function stepTransition(outEl: Element, inEl: Element): gsap.core.Timeline {
	const tl = gsap.timeline();
	tl.to(outEl, { x: -40, opacity: 0, duration: 0.25, ease: 'power2.in' });
	tl.fromTo(inEl, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out' });
	return tl;
}

export function celebrationReveal(container: Element): gsap.core.Tween {
	const children = container.querySelectorAll('[data-reveal]');
	gsap.set(children, { y: 20, opacity: 0 });
	return gsap.to(children, {
		y: 0,
		opacity: 1,
		duration: 0.5,
		stagger: 0.12,
		ease: 'back.out(1.4)'
	});
}

export const pageTransition = {
	in(element: Element): gsap.core.Tween {
		return gsap.from(element, {
			opacity: 0,
			y: 10,
			duration: 0.3,
			ease: 'power2.out'
		});
	},
	out(element: Element): gsap.core.Tween {
		return gsap.to(element, {
			opacity: 0,
			y: -10,
			duration: 0.2,
			ease: 'power2.in'
		});
	}
};
