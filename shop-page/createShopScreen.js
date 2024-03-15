export function createShopPage() {
	let shopPageEl = document.createElement('div')
	shopPageEl.innerHTML = `<div id="shop-container" style="aspect-ratio: 7 / 4;width: 800px;background-color: #0C2A4E;display: flex;flex-direction: row;">
          <div id="upgrades-panel" style="width: 30%;margin: 20px;background-color: #90A2C6;border-radius: 10px;display: flex;flex-direction: column;align-items: center;">
              <h2 style="text-align: center;font-size: 40px;margin: 0;padding: 0;color: #20306C;">upgrades</h2>
              <div class="speed-upgrade-container" style="margin-top: 9px;">
                  <h3 class="upgrade-name" style="font-size: 23px;text-align: center;margin: 0;padding: 0;color: #9FDEFF;">(i) speed</h3>
                  <img class="speed-upgrade-image" src="shop-assets/boat-speed.png" style="height: 70px;">
                  <p class="cost" style="margin: 0;padding: 0;color: #E7E155;font-size: 20px;font-weight: 600;text-align: center;">cost: 1</p>
              </div>
              <div class="max-health-upgrade-container" style="display: flex;flex-direction: column;align-items: center;">
                  <h3 class="upgrade-name" style="font-size: 23px;text-align: center;margin: 0;padding: 0;color: #383F89;">(o) max health</h3>
                  <img class="max-health-upgrade-image" src="shop-assets/health-shield.png" style="width: 70px;">
                  <p class="cost" style="margin: 0;padding: 0;color: #E7E155;font-size: 20px;font-weight: 600;text-align: center;">cost: 2</p>
              </div>
              <div class="teleporter-upgrade-container" style="display: flex;flex-direction: column;align-items: center;">
                  <h3 class="upgrade-name" style="font-size: 23px;text-align: center;margin: 0;padding: 0;color: #A74CAD;">(k) teleporter</h3>
                  <img class="teleport-upgrade-image" src="shop-assets/teleport-icon.png" style="width: 120px;">
                  <p class="cost" style="margin: 0;padding: 0;color: #E7E155;font-size: 20px;font-weight: 600;text-align: center;">cost: 5</p>
              </div>
          </div>
          <div class="right-panels-container" style="flex-grow: 1;display: flex;flex-direction: column;align-items: center;">
              <div class="shop-and-balance-container" style="margin-top: 15px;width: 100%;display: flex;flex-direction: row;">
                  <div class="shop-text-container" style="width: 175px;background-color: #272C7F;border-radius: 5px;border: 2px solid #9FDDFF;">
                      <h1 style="text-align: center;font-size: 43px;margin: 0;padding: 20px;font-weight: 600;color: #499EFF;">Shop</h1>
                  </div>
                  <div class="current-balance-container" style="width: 310px;margin-left: 15px;display: flex;flex-direction: column;align-items: center;">
                      <h3 style="margin: 0 0 3px 0;padding: 0;text-align: center;display: block;color: #E7E155;">Current Balance</h3>
                      <div class="balance-token-container" style="width: 90%;height: 60px;border: 2px solid yellow;border-radius: 7px;"></div>
                  </div>
              </div>
              <div class="bottom-right-panels-container" style="width: 100%;flex-grow: 1;display: flex;flex-direction: row;align-items: center;margin-top: 20px;">
                  <div class="new-ship-icon-container" style="background-color: #375B84;height: 95%;width: 300px;border-radius: 15px;display: flex;flex-direction: column;align-items: center;">
                      <p class="cost" style="margin: 0;padding: 0;color: #E7E155;font-size: 20px;font-weight: 600;text-align: center;">cost: 3</p>
                      <img class="big-ship-image" src="shop-assets/big-ship-screenshot.png" style="width: 260px;border-radius: 5px;">
                      <h3 id="new-ship-upgrade-name" style="font-weight: 600;color: white;">(b) new ship</h3>
                  </div>
                  <div class="close-and-heal-icons-container" style="margin-left: 25px;width: 150px;height: 100%;">
                      <div class="close-button-container" style="border: 3px solid #FF0000;width: 125px;height: 125px;margin: auto;margin-top: 20px;display: flex;flex-direction: column;align-items: center;border-radius: 5px;">
                          <img class="close-icon-image" src="shop-assets/close-icon.png" style="width: 85px;margin-top: 7px;">
                          <p class="close-text" style="color: #FF0000;text-align: center;margin: 0;padding: 0;font-weight: 600;font-size: 25px;">(m) close</p>
                      </div>
                      <div class="heal-button-container" style="border: 3px solid #61D568;width: 125px;height: 125px;margin: auto;margin-top: 20px;border-radius: 5px;display: flex;flex-direction: column;align-items: center;">
                          <p class="cost heal-cost" style="margin: 0;padding: 0;color: #E7E155;font-size: 20px;font-weight: 600;text-align: center;">cost: 1</p>
                          <img class="heal-icon-image" src="shop-assets/heal-icon.png" style="width: 65px;margin-top: 7px;">
                          <p class="heal-text" style="color: #61D568;text-align: center;margin: 0;padding: 0;font-weight: 600;font-size: 25px;">(h) heal</p>
                      </div>
                  </div>
              </div>
          </div>
      </div>`
	return shopPageEl
}
