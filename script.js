window.addEventListener('DOMContentLoaded', () => {
	const script = document.createElement('script');
	script.src = 'content/data.js';
	script.onload = () => {
		if (typeof content !== 'undefined' && Array.isArray(content.links)) {
			displayLinks(content.links);
		}
	};
	document.body.appendChild(script);
});

function displayLinks(links) {
	const container = document.getElementById('links-container');
	container.innerHTML = '';
	links.forEach(link => {
		const card = document.createElement('div');
		const d = new Date(link.dateAdded);
		card.className = 'link-card';
		card.innerHTML = `
			<h2><a href="${link.url}" target="_blank">${link.name}</a></h2>
			<p>${link.description}</p>
			<span class="category">${link.categories}</span>
			<span class="date">Added : ${d.toDateString()}</span>
		`;
		container.appendChild(card);
	});
}
