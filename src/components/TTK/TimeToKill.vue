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
	</div>
</template>

<script>
	import ResponsiveTable from "./ResponsiveTable";
	import TTKCoreService from "../../utils/TTKCore";
	import StatInputV2 from "../generic/StatInputV2";

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
		methods: {
			updateTables(data) {
				// I need to come up with a better name with this variable
				this.data = data;
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
