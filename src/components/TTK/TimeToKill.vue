<template>
	<div class="ttk-ui">
		<span class="section-title"> Time To Kill / Bullets to Kill </span>
		<div class="toolbar">
			<StatInputV2
				:label="'Headshot Chance'"
				v-model="headshotChance"
				v-bind:max="100"
				:showMaxVal="true"
				@input="applyCHCandHSDtoTheTables()"
			></StatInputV2>
			<div class="spacer"></div>
		</div>
		<template v-for="(tablesData, idx) in data">
			<div
				class="weapon-tables-container"
				v-bind:key="idx"
				v-if="tablesData"
			>
				<span class="ttk-weapon-name">{{ tablesData.weaponName }}</span>
				<div class="ttk-tables">
					<!-- TODO: this will probably need to be rewritten -->
					<ResponsiveTable
						v-for="(tables, idx) in tablesData.tables"
						v-bind:key="idx"
						:title="`${idx + 1} Players`"
						:headers="tables.headers"
						:rowData="tables.rowData"
					></ResponsiveTable>
					<!-- TOOO: consider putting graph here -->
				</div>
			</div>
		</template>
		<div id="ttk-chart"></div>
	</div>
</template>

<script>
	import ResponsiveTable from "./ResponsiveTable";
	import TTKCoreService from "../../utils/TTKCore";
	import StatInputV2 from "../generic/StatInputV2";
	import Plotly from "plotly.js-dist";
	import {
		getPlotlyDefault1,
		getPlotlyDefault2,
	} from "../../utils/plotDefaults";
	import StatsService from "../../utils/statsService";
	import { UI_WEAPON_SLOT_ENUM } from "../../utils/utils";


	const DEFAULT_PLOT = getPlotlyDefault1(
		"Rounds",
		"Seconds"
	);
	const DEFAULT_PLOT_2 = getPlotlyDefault2();

	export default {
		name: "TimeToKill",
		components: {
			ResponsiveTable,
			StatInputV2,
		},
		data() {
			return {
				data: [],
				headshotChance: 0,
				target: null,
			};
		},
		created() {
			TTKCoreService.subscribeToCoreWeaponData().subscribe(
				(tableData) => {
					// TODO: look at this
					// maybe call ttkcore service directory multiple times 
					this.updateTables(tableData);
					if (this.isHSDSet()) {
						this.applyHSDtoTheTables();
					}
				}
			);
		},
		mounted() {
			this.target = document.getElementById("ttk-chart");
			Plotly.newPlot(this.target, [], DEFAULT_PLOT, DEFAULT_PLOT_2);
		},
		methods: {
			updateTables(data) {
				// I need to come up with a better name with this variable
				this.data = data;
				const chartData = [];

				for (let i = 0; i < data.length; i++) {
					const weapon = data[i];
					if (!weapon) continue;

					const stats = StatsService.getWeaponStatsPerSlot(UI_WEAPON_SLOT_ENUM[0], 0, 0);
					const results = [];
					for (let j = 0; j < 50; j++) {
						// TODO: configure enemy type and difficulty
						const result = TTKCoreService.calculateTimeToKillBulletToKill(stats, "elite", "heroic", 0, false);
						results.push(result);
					}

					const trace = {
						x: results.map((result) => result.shotsFired),
						y: results.map((result) => result.timePassed),
						type: "scatter",
						mode: "markers",
						// marker: {
						// 	color: "#E69F00",
						// 	size: 10,
						// },
					};
					chartData.push(trace);
				}
				
				Plotly.react(
					this.target,
					chartData,
					DEFAULT_PLOT,
					DEFAULT_PLOT_2
				);
			},
			applyHSDtoTheTables() {
				TTKCoreService.applyCHCandHSDtoTheTables(
					0,
					this.headshotChance
				);
			},
			isHSDSet() {
				return this.headshotChance !== 0;
			},
		},
	};
</script>

.<style scoped>
	.ttk-ui {
		width: 100%;
	}

	.ttk-tables {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 20px;
	}

	span.ttk-weapon-name {
		font-weight: 800;
		font-size: 18px;
		margin-top: 16px;
		display: block;
	}
</style>
