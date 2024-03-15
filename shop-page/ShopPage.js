export class ShopPage {
	constructor(canvasContainer) {
		this.shopPageEl = document.createElement('div')
		canvasContainer.appendChild(this.shopPageEl)
		this.shopPageEl.innerHTML = `
		<link rel="stylesheet" href="shop-page/style.css" />
		<div id="shop-container">
			<div id="info">
				<div id="current-balance-container">
					<p>Current Balance: </p>
					<div id="balance-token-container"></div>
				</div>
				<p id="teleporter-info"> Teleporter: Missing </p>
				<br />
				<p id="shop-shortcut-info"> [m] Shop </p>
			</div>
			<div id="shop">
				<div class="small-item">
					<img src="../assets/ui/heart.svg" alt="Heart Icon" />
					<strong>[h] Heal</strong>
					<p>1 Token</p>
				</div>
				<div class="small-item">
					<img src="../assets/ui/activity.svg" alt="Activity Icon" />
					<strong>[o] Max Health</strong>
					<p>2 Tokens</p>
				</div>
				<div class="small-item">
					<img src="../assets/ui/arrow-up-circle.svg" alt="Arrow Up in Circle Icon" />
					<strong>[i] Speed Boost</strong>
					<p>1 Token</p>
				</div>
				<div class="small-item">
					<img src="../assets/ui/chevrons-up.svg" alt="Up Chevrons Icon" />
					<strong>[k] Teleporter</strong>
					<p>5 Token</p>
				</div>
				<div class="large-item">
					<img src="../assets/ui/big-ship-screenshot.png" alt="Big Ship Screenshot" />
					<strong>[b] Big Ship</strong>
					<p>3 Tokens</p>
				</div>
			</div>
		</div>`

		this.is_open = false
	}

	updateTeleporterStatus(status) {
		const teleporterInfo = document.querySelector('#teleporter-info')
		teleporterInfo.innerHTML = status
	}

	updateBalance(balance) {
		const balanceTokenContainer = document.querySelector(
			'#balance-token-container'
		)
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
		document.querySelector('#shop').style.display = this.is_open
			? 'grid'
			: 'none'
	}
}
