export class ShopPage {
	constructor(canvasContainer) {
		this.shopPageEl = document.createElement('div')
		canvasContainer.appendChild(this.shopPageEl)
		this.shopPageEl.innerHTML = `
		<div id="shop-container-wrapper">
			<div id="shop-container">
				<link rel="stylesheet" href="shop-page/style.css" />
				<div id="upgrades-panel">
					<h2>upgrades</h2>
					<div class="speed-upgrade-container">
						<h3 class="upgrade-name">(i) speed</h3>
						<img class="speed-upgrade-image" src="assets/ui/boat-speed.png" />
						<p class="cost">cost: 1</p>
					</div>
					<div class="max-health-upgrade-container">
						<h3 class="upgrade-name">(o) max health</h3>
						<img
							class="max-health-upgrade-image"
							src="assets/ui/health-shield.png"
						/>
						<p class="cost">cost: 2</p>
					</div>
					<div class="teleporter-upgrade-container">
						<h3 class="upgrade-name">(k) teleporter</h3>
						<img
							class="teleport-upgrade-image"
							src="assets/ui/teleport-icon.png"
						/>
						<p class="cost">cost: 5</p>
					</div>
				</div>
				<div class="right-panels-container">
					<div class="shop-and-balance-container">
						<div class="shop-text-container">
							<h1>Shop</h1>
						</div>
						<div class="current-balance-container">
							<h3>Current Balance</h3>
							<div class="balance-token-container"></div>
						</div>
					</div>
					<div class="bottom-right-panels-container">
						<div class="new-ship-icon-container">
							<p class="cost">cost: 3</p>
							<img
								class="big-ship-image"
								src="assets/ui/big-ship-screenshot.png"
							/>
							<h3 id="new-ship-upgrade-name">(b) new ship</h3>
						</div>
						<div class="close-and-heal-icons-container">
							<div class="close-button-container">
								<img class="close-icon-image" src="assets/ui/close-icon.png" />
								<p class="close-text">(m) close</p>
							</div>
							<div class="heal-button-container">
								<p class="cost heal-cost">cost: 1</p>
								<img class="heal-icon-image" src="assets/ui/heal-icon.png" />
								<p class="heal-text">(h) heal</p>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div id="info-container">
				<p id="shop-shortcut-info"> Shop: press m </p>
				<p id="teleporter-info"> Teleporter: Missing </p>
			</div>
		</div>`

		this.is_open = false
		document.querySelector('#shop-container').style.display = 'none'
	}

	updateTeleporterStatus(status) {
		const teleporterInfo = document.querySelector('#teleporter-info')
		teleporterInfo.innerHTML = status
	}

	updateBalance(balance) {
		const balanceTokenContainer = document.querySelector(
			'.balance-token-container',
		)
		console.log(balanceTokenContainer)
		balanceTokenContainer.innerHTML = ''
		for (let i = 0; i < balance; i++) {
			const token = document.createElement('img')
			token.classList.add('balance-token')
			token.src = 'assets/ui/token.png'
			balanceTokenContainer.appendChild(token)
		}
	}

	toggle() {
		this.is_open = !this.is_open
		document.querySelector('#shop-container').style.display = this.is_open
			? 'flex'
			: 'none'
		document.querySelector('#info-container').style.display = this.is_open
			? 'none'
			: 'block'
	}
}
