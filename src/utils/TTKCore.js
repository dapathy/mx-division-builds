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
				// TODO: figure out new model for row data.  TTK component uses this directly
				const currentRow = [difficulty];
				for (let enemyType of enemyTypes) {
					const enemyStats = calculateHealthAndArmor(
						enemyType,
						difficulty,
						i
					);
					const enemyHp = enemyStats.health;
					const enemyArmor = enemyStats.armor;
					
					const results = this.recursiveTimeToKillBulletToKill(
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

	// TODO: update this to use critical hit change and critical hit damage
	// going to need to loop and calculate damage for each shot
	recursiveTimeToKillBulletToKill(
		weaponStats,
		enemyHP,
		enemyArmor,
		shotsFired = 0,
		timePassed = 0,
		reloads = 0
	) {
		const { dmgToOutOfCover, dmgToOutOfCoverArmored, totalMagSize, reloadSpeed, rpm, chc, chd } = weaponStats;
		const fireRate = rpm / 60;
	
		const calculateDamage = (baseDamage) => {
			const isCriticalHit = Math.random() < chc;	// are my units correct here?
			return isCriticalHit ? baseDamage * + chd : baseDamage;
		};

		if (enemyArmor > 0) {
			const shotsToDepleteArmor = Math.ceil(enemyArmor / dmgToOutOfCoverArmored);
			const shotsRemainingInMag = totalMagSize - (shotsFired % totalMagSize);
			const shotsToFire = Math.min(shotsToDepleteArmor, shotsRemainingInMag);
			const timeToFire = shotsToFire / fireRate;
	
			enemyArmor -= shotsToFire * dmgToOutOfCoverArmored;
			shotsFired += shotsToFire;
			timePassed += timeToFire;
	
			if (shotsToFire < shotsToDepleteArmor) {
				reloads++;
				timePassed += reloadSpeed;
			}
	
			return this.recursiveTimeToKillBulletToKill(
				weaponStats,
				enemyHP,
				enemyArmor,
				shotsFired,
				timePassed,
				reloads
			);
		} else if (enemyHP > 0) {
			const shotsToDepleteHP = Math.ceil(enemyHP / dmgToOutOfCover);
			const shotsRemainingInMag = totalMagSize - (shotsFired % totalMagSize);
			const shotsToFire = Math.min(shotsToDepleteHP, shotsRemainingInMag);
			const timeToFire = shotsToFire / fireRate;
	
			enemyHP -= shotsToFire * dmgToOutOfCover;
			shotsFired += shotsToFire;
			timePassed += timeToFire;
	
			if (shotsToFire < shotsToDepleteHP) {
				reloads++;
				timePassed += reloadSpeed;
			}
	
			return this.recursiveTimeToKillBulletToKill(
				weaponStats,
				enemyHP,
				enemyArmor,
				shotsFired,
				timePassed,
				reloads
			);
		} else {
			return { shotsFired, timePassed, reloads };
		}
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
