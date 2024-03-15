const SPEED_UPGRADE_COST = 1
const MAX_HEALTH_UPGRADE_COST = 2
const TELEPORTER_UPGRADE_COST = 5
const BIG_BOAT_COST = 3
const HEAL_COST = 1

export class MoneySystem {
	#balance
	#big_boat_purchased
	#speed_upgrade_purchased
	#max_health_upgrade_purchased
	#teleporter_purchased

	constructor(initialBalance = 0.0) {
		this.#balance = initialBalance
		this.#big_boat_purchased = false
	}

	// utilities
	incrementBalance(amount) {
		this.#balance += amount
	}
	getBalance() {
		return this.#balance
	}

	// helpers to check if you can purchase different things
	canPurchaseBigBoat() {
		return !(this.#balance < BIG_BOAT_COST || this.#big_boat_purchased)
	}
	canPurchaseSpeedUpgrade() {
		return !(
			this.#balance < SPEED_UPGRADE_COST || this.#speed_upgrade_purchased
		)
	}
	canPurchaseMaxHealthUpgrade() {
		return !(
			this.#balance < MAX_HEALTH_UPGRADE_COST ||
			this.#max_health_upgrade_purchased
		)
	}
	canPurchaseTeleporterUpgrade() {
		return !(
			this.#balance < TELEPORTER_UPGRADE_COST || this.#teleporter_purchased
		)
	}
	canPurchaseHeal() {
		return this.#balance >= HEAL_COST
	}

	// buy stuff
	purchaseBigBoat() {
		if (this.canPurchaseBigBoat()) {
			return false
		}
		this.#balance -= BIG_BOAT_COST
		this.#big_boat_purchased = true
		return true
	}
	purchaseSpeedUpgrade() {
		if (this.canPurchaseSpeedUpgrade()) {
			return false
		}
		this.#balance -= SPEED_UPGRADE_COST
		this.#speed_upgrade_purchased = true
		return true
	}
	purchaseMaxHealthUpgrade() {
		if (this.canPurchaseMaxHealthUpgrade()) {
			return false
		}
		this.#balance -= MAX_HEALTH_UPGRADE_COST
		this.#max_health_upgrade_purchased = true
		return true
	}
	purchaseTeleporterUpgrade() {
		if (this.canPurchaseTeleporterUpgrade()) {
			return false
		}
		this.#balance -= TELEPORTER_UPGRADE_COST
		this.#teleporter_purchased = true
		return true
	}
	purchaseHeal() {
		if (this.#balance < HEAL_COST) {
			return false
		}
		this.#balance -= HEAL_COST
		return true
	}
}
