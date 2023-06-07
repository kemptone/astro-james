document.addEventListener("DOMContentLoaded", () => {

	const elements = {
		form : document.querySelector("#form")
		, size : document.querySelector("#size")
		, points : document.querySelector("#points")
		, oddoffset : document.querySelector("#oddoffset")
		, button : document.querySelector("#form button")
		, wrap : document.querySelector("#spin-wrap")
		, svg : document.querySelector("#spin-wrap svg")
	}

	let size = Number(elements.form.dataset.size)
	let points = Number(elements.form.dataset.points)
	let oddOffset = Number(elements.form.dataset.oddoffset)
	let spinning = false

	const createStar = ({ points = 5, x = 0, y = 0, size = 1 }) => {
		const length = points * 2;

		return Array.from({ length }, (_, i) =>
			new DOMMatrix()
				.translate(x, y)
				.scale(size)
				.rotate((i / length) * 360)
				.translate(0, i % 2 ? -1 : oddOffset)
				.transformPoint({ x: 0, y: 0 })
		);
	};

	function metaCreateStar() {
		const starPoints = createStar({ x: 50, y: 50, size, points });
		const starPath = document.querySelector(".star-path");
		starPath.setAttribute(
			"d",
			// SVG path syntax
			`M ${starPoints
				.map((point) => `${point.x} ${point.y}`)
				.join(", ")} z`
		);
	}

	metaCreateStar();

	function toggleSpinningState () {
		spinning = !spinning
		if (spinning) {
			elements.button.innerHTML ="Stop"
			elements.wrap.classList.add("spinning")
		} else {
			elements.button.innerHTML = "Start"
			elements.wrap.classList.remove("spinning")
		}
	}

	elements.size.addEventListener("input", (e) => {
		const value = Number(e.target.value);
		size = value;
		metaCreateStar();
	});

	elements.points.addEventListener("input", (e) => {
		const value = Number(e.target.value);
		points = value;
		metaCreateStar();
	});

	elements.oddoffset.addEventListener("input", (e) => {
		const value = Number(e.target.value);
		oddOffset = value;
		metaCreateStar();
	});

	elements.form.addEventListener("submit", e => {
		e.preventDefault()
		toggleSpinningState()
	})

	elements.svg.addEventListener("animationend", e => {
		toggleSpinningState()
	})

});