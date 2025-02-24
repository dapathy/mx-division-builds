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
						enemyHP
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

	// TODO: rewrite this to use armor
	recursiveTimeToKillBulletToKill(
		weaponStats,
		enemyHP,
		shotsFired = 0,
		timePassed = 0,
		reloads = 0
	) {
		if (enemyHP <= weaponStats.dmgToOutOfCoverArmoredPerMag) {
			if (enemyHP == weaponStats.dmgToOutOfCoverArmoredPerMag) {
				// return calculations with out counting bullets to kill and just return mag size
			} else {
				shotsFired += Math.ceil(
					enemyHP / weaponStats.dmgToOutOfCoverArmored
				);
				// -1 because the first shot should always show 0s on the TTK
				timePassed +=
					(shotsFired / (weaponStats.rpm / 60) -
						1 / (weaponStats.rpm / 60)) *
					1000;
				timePassed = timePassed / 1000;
			}
			return {
				shotsFired,
				timePassed,
				reloads,
			};
		} else {
			const remaningHP =
				enemyHP - weaponStats.dmgToOutOfCoverArmoredPerMag;
			shotsFired += weaponStats.totalMagSize;
			timePassed +=
				weaponStats.timeToEmptyMagazine + weaponStats.reloadSpeed;
			return this.recursiveTimeToKillBulletToKill(
				weaponStats,
				remaningHP,
				shotsFired,
				timePassed,
				reloads + 1
			);
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
