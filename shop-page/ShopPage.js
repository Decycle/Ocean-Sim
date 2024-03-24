export class ShopPage {
	constructor(canvasContainer) {
		this.shopPageEl = document.createElement('div')
		canvasContainer.appendChild(this.shopPageEl)
		this.shopPageEl.innerHTML = `
		<link rel="stylesheet" href="shop-page/style.css" />
		<div id="ui-container">
			<div id="info">
				<div id="health-container">
					<p>Health:</p>
					<div id="health-heart-container"></div>
				</div>
				<div id="balance-container">
					<p>Balance:</p>
					<div id="balance-token-container"></div>
				</div>
				<p id="teleporter-info">Teleporter: None</p>
				<div id="menu-container">
					<p id="shop-shortcut-info">[m] Shop</p>
					<p id="cheats-shortcut-info">[c] Cheats</p>
				</div>
			</div>
			<div id="shop">
				<div class="small-item">
					<img src="assets/ui/heart.svg" alt="Heart Icon" />
					<div>
						<strong>[h] Heal</strong>
						<p>1 Token</p>
					</div>
				</div>
				<div class="small-item">
					<img src="assets/ui/arrow-up-circle.svg" alt="Arrow Up in Circle Icon" />
					<div>
						<strong>[i] Max Speed Boost</strong>
						<p>1 Token</p>
					</div>
				</div>
				<div class="small-item">
					<img src="assets/ui/activity.svg" alt="Activity Icon" />
					<div>
						<strong>[o] Max Health Boost</strong>
						<p>2 Tokens</p>
					</div>
				</div>
				<div class="small-item">
					<img src="assets/ui/chevrons-up.svg" alt="Up Chevrons Icon" />
					<div>
						<strong>[k] Teleporter</strong>
						<p>5 Tokens</p>
					</div>
				</div>
				<div class="large-item">
					<img src="assets/ui/big-ship.png" alt="Big Ship Screenshot" />
					<div>
						<strong>[b] Big Ship</strong>
						<p>3 Tokens</p>
					</div>
				</div>
			</div>
			<div id="cheats">
				<div class="cheat-shortcut">
					<strong>[l] Jump to Splash!</strong>
				</div>
				<div class="cheat-shortcut">
					<strong>[g] Give Money</strong>
				</div>
				<div class="cheat-shortcut">
					<strong>[j] Reset Teleporter</strong>
				</div>
				<div class="cheat-shortcut">
					<strong>[n] Next Render Step</strong>
				</div>
			</div>
		</div>`

		this.shop_is_open = false
		this.cheats_is_open = false
	}

	updateTeleporterStatus(status) {
		const teleporterInfo = document.querySelector('#teleporter-info')
		teleporterInfo.innerHTML = status
	}

	updateHealth(health) {
		health = Math.ceil(health * 10)
		const healthHeartContainer = document.querySelector(
			'#health-heart-container'
		)
		healthHeartContainer.innerHTML = ''
		for (let i = 0; i < health && i < 30; i++) {
			const heart = document.createElement('img')
			heart.classList.add('heart')
			heart.src = 'assets/ui/heart-red.svg'
			healthHeartContainer.appendChild(heart)
		}
		if (health > 30) {
			const heart_more = document.createElement('p')
			heart_more.classList.add('more')
			heart_more.innerHTML = '+'
			healthHeartContainer.appendChild(heart_more)
		}
	}

	updateBalance(balance) {
		const balanceTokenContainer = document.querySelector(
			'#balance-token-container'
		)
		balanceTokenContainer.innerHTML = ''
		for (let i = 0; i < balance && i < 10; i++) {
			const token = document.createElement('img')
			token.classList.add('balance-token')
			token.src = 'assets/ui/token.png'
			balanceTokenContainer.appendChild(token)
		}
		if (balance > 10) {
			const token_more = document.createElement('p')
			token_more.classList.add('more')
			token_more.innerHTML = '+'
			balanceTokenContainer.appendChild(token_more)
		}
	}

	changeShopState(state) {
		this.shop_is_open = state
		document.querySelector('#shop').style.display = state ? 'grid' : 'none'
		document.querySelector('#shop-shortcut-info').innerHTML = state
			? '[m] Hide Shop'
			: '[m] Shop'
	}

	changeCheatsState(state) {
		this.cheats_is_open = state
		document.querySelector('#cheats').style.display = state ? 'grid' : 'none'
		document.querySelector('#cheats-shortcut-info').innerHTML = state
			? '[c] Hide Cheats'
			: '[c] Cheats'
	}

	shopToggle() {
		if (this.cheats_is_open) this.changeCheatsState(false)
		this.changeShopState(!this.shop_is_open)
	}

	cheatsToggle() {
		if (this.shop_is_open) this.changeShopState(false)
		this.changeCheatsState(!this.cheats_is_open)
	}
}
