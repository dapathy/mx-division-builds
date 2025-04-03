import { BehaviorSubject, combineLatest, timer } from "rxjs";
import { debounce } from "rxjs/operators";
import StatsService from "./statsService";
import calculateHealthAndArmor from "./enemyHealth";

class DPSChartCoreService {
	_subjects = {
		Primary: new BehaviorSubject(),
		Secondary: new BehaviorSubject(),
		SideArm: new BehaviorSubject(),
	};

	subscribeToCoreWeaponData() {
		return combineLatest([
			this._subjects.Primary,
			this._subjects.Secondary,
			this._subjects.SideArm,
		]).pipe(debounce(() => timer(300)));
	}

	// TODO: somewhere we'll need to be able to run this multiple times to get a sampling
	addCoreWeaponData(slot, weaponStats) {
		if (weaponStats.weaponName == null) {
			this._subjects[slot].next(undefined);
			return;
		}

		const headers = ["   ", "Normal", "Veteran", "Elite"];
		const enemyTypes = ["normal", "veteran", "elite"];
		const difficulties = ["normal", "hard", "challenging", "heroic"];
		const weaponTTKData = [];
		const maxGroupSize = 4;
		for (let i = 0; i < maxGroupSize; i++) {
			const rowData = [];
			for (const difficulty of difficulties) {
				// Row Name is first in current Row
				const currentRow = [difficulty];
				for (let enemyType of enemyTypes) {
					const enemyStats = calculateHealthAndArmor(
						enemyType,
						difficulty,
						i
					);
					const enemyHp = enemyStats.health;
					const enemyArmor = enemyStats.armor;
					
					const results = this.calculateTimeToKillBulletToKill(
						weaponStats,
						enemyHp,
						enemyArmor
					);
					currentRow.push(
						`${results.timePassed.toFixed(
							1
						)}s / ${results.shotsFired.toFixed(0)} `
					);
				}
				rowData.push(currentRow);
			}
			weaponTTKData.push({ rowData, headers });
		}
		this._subjects[slot].next({
			weaponName: weaponStats.weaponName,
			tables: weaponTTKData,
		});
	}

	// TODO: verify this
	calculateTimeToKillBulletToKill(
		weaponStats,
		enemyHP,
		enemyArmor
	) {
		const { dmgToOutOfCover, dmgToOutOfCoverArmored, totalMagSize, reloadSpeed, rpm, chc, chd } = weaponStats;
		const fireRate = rpm / 60;
		let shotsFired = 0, timePassed = 0, reloads = 0;
		let currentMagSize = totalMagSize;
	
		const calculateDamage = (baseDamage) => {
			const randomPercentage = Math.random() * 100; // Convert to a percentage
			const isCriticalHit = randomPercentage < chc;
			return isCriticalHit ? baseDamage + chd : baseDamage;
		};
	
		while (enemyArmor > 0 || enemyHP > 0) {
			if (currentMagSize === 0) {
				reloads++;
				timePassed += reloadSpeed;
				currentMagSize = totalMagSize;
			}
	
			const damage = enemyArmor > 0 ? calculateDamage(dmgToOutOfCoverArmored) : calculateDamage(dmgToOutOfCover);
			if (enemyArmor > 0) {
				enemyArmor -= damage;
				if (enemyArmor < 0) {
					enemyHP += enemyArmor; // carry over remaining damage to HP
					enemyArmor = 0;
				}
			} else {
				enemyHP -= damage;
			}
	
			shotsFired++;
			currentMagSize--;
			timePassed += 1 / fireRate;
		}
	
		return { shotsFired, timePassed, reloads };
	}

	applyCHCandHSDtoTheTables(chc, hsd) {
		["Primary", "Secondary", "SideArm"].forEach((slot) => {
			const weaponStat = StatsService.getWeaponStatsPerSlot(
				slot,
				chc,
				hsd
			);
			if (weaponStat.weaponName) {
				this.addCoreWeaponData(slot, weaponStat);
			}
		});
	}
}

export default new DPSChartCoreService();
