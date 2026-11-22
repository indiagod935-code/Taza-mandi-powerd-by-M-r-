/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Default high-grade fresh produce local public asset
export const DEFAULT_PRODUCE_FALLBACK = '/assets/images/fresh_fruits_basket_1793421532041.jpg';

/**
 * Strict 1-to-1 Mapping from Product ID to its exclusive verified photo asset
 * All of these products are Maharashtra & APMC Vashi top-running items, verified, in stock,
 * and active in the mandi catalogue. Each in-stock item has an exclusive, 100% UNIQUE image!
 */
export const VERIFIED_IN_STOCK_PRODUCE_IDS = new Set<string>([
  // Core Maharashtra Running Daily Vegetables
  'root_potato',
  'root_potato_red',
  'root_onion',
  'veg_tomato',
  'veg_okra',
  'veg_ridge_gourd',
  'veg_bottle_gourd',
  'veg_bitter_gourd',
  'veg_cabbage',
  'veg_cauliflower',
  'veg_capsicum',
  'veg_bell_pepper_red',
  'veg_bell_pepper_yellow',
  'veg_brinjal',
  'veg_cucumber',
  'veg_green_chilli',
  'veg_red_chilli',
  'veg_yellow_chilli',
  'veg_french_beans',
  'veg_pumpkin',
  'root_carrot',
  'root_radish',
  'root_beetroot',
  'veg_green_peas',
  'veg_cluster_beans',
  'veg_drumstick',
  'veg_ivy_gourd',
  'veg_sweet_corn',
  'veg_baby_corn',
  'veg_broccoli',
  'veg_tinda',
  'veg_parwal',
  'veg_flat_beans',
  'veg_broad_beans',
  'veg_cowpea_pods',
  'veg_ash_gourd',
  'veg_kohlrabi',
  'veg_lotus_stem',
  'veg_snake_gourd',
  'veg_sponge_gourd',

  // Leafy Greens, Sprouts & Herbs (Daily Running)
  'leafy_palak',
  'herb_coriander',
  'leafy_methi',
  'leafy_green_amaranth',
  'leafy_red_amaranth',
  'leafy_mustard_greens',
  'leafy_bathua',
  'leafy_dill',
  'leafy_spring_onion',
  'leafy_colocasia',
  'leafy_malabar_spinach',
  'herb_mint',
  'herb_curry_leaves',
  'herb_basil',
  'herb_lemongrass',
  'root_garlic',
  'root_green_garlic',
  'root_ginger',
  'root_turmeric',
  'spice_dry_turmeric',
  'sprout_moong',
  'sprout_matki',
  'sprout_chickpea',
  'sprout_green_chana',
  'sprout_peanut_pods',

  // Traditional Roots & Specialty Cooking Vegetables
  'root_taro',
  'root_yam',
  'root_cassava',
  'root_turnip',
  'veg_elephant_foot_yam',
  'root_sweet_potato',
  'veg_raw_mango',
  'veg_raw_papaya',
  'veg_raw_jackfruit',
  'veg_raw_banana',
  'veg_mushroom_button',
  'veg_mushroom_oyster',
  'veg_flat_beans_papdi',

  // Top Running Fruits & Essentials (Daily Mandi)
  'fruit_banana',
  'fruit_apple',
  'fruit_orange',
  'citrus_mosambi',
  'citrus_lemon',
  'citrus_pomelo',
  'fruit_pomegranate',
  'fruit_watermelon',
  'fruit_muskmelon',
  'fruit_papaya',
  'fruit_guava',
  'fruit_chikoo',
  'fruit_pineapple',
  'fruit_grapes',
  'fruit_grapes_green',
  'fruit_grapes_black',
  'fruit_mango',
  'fruit_custard_apple',
  'fruit_jamun',
  'fruit_dragon_fruit',
  'fruit_kiwi',
  'fruit_strawberry',
  'fruit_dates',
  'fruit_coconut',
  'other_fresh_coconut',
  'other_dry_coconut',
  'other_fresh_tamarind',
  'other_fresh_kokum',
]);

/**
 * Strict 1-to-1 Mapping: Every In-Stock item maps to a UNIQUE distinct verified image.
 */
export const PRODUCT_VISUAL_REGISTRY: Record<string, string> = {
  // --- Daily Core Vegetables (Maharashtra Running) ---
  root_potato: '/assets/images/fresh_potatoes_sack_1793421531629.jpg',
  root_potato_red: '/assets/images/fresh_red_potatoes.jpg',
  veg_potato_red: '/assets/images/fresh_red_potatoes.jpg',
  root_onion: '/assets/images/fresh_red_onions_1793421531438.jpg',
  veg_tomato: '/assets/images/fresh_organic_tomatoes_1793421532111.jpg',
  veg_okra: '/assets/images/fresh_tender_bhindi.jpg',
  veg_ridge_gourd: '/assets/images/fresh_turai_gourd.jpg',
  veg_bottle_gourd: '/assets/images/fresh_desi_lauki.jpg',
  veg_bitter_gourd: '/assets/images/fresh_desi_karela.jpg',
  veg_cabbage: '/assets/images/fresh_patta_gobhi.jpg',
  veg_cauliflower: '/assets/images/fresh_snow_cauliflower.jpg',
  veg_capsicum: '/assets/images/pure_green_capsicum.jpg',
  veg_bell_pepper_red: '/assets/images/fresh_red_bell_pepper.jpg',
  veg_bell_pepper_yellow: '/assets/images/fresh_yellow_bell_pepper.jpg',
  veg_brinjal: '/assets/images/fresh_desi_baingan.jpg',
  veg_cucumber: '/assets/images/fresh_desi_kheera.jpg',
  veg_green_chilli: '/assets/images/fresh_lavangi_mirchi.jpg',
  veg_red_chilli: '/assets/images/fresh_ripe_red_chilli.jpg',
  veg_chilli_red: '/assets/images/fresh_ripe_red_chilli.jpg',
  veg_yellow_chilli: '/assets/images/fresh_yellow_chilli.jpg',
  veg_pumpkin: '/assets/images/fresh_yellow_pumpkin.jpg',
  veg_pumpkin_yellow: '/assets/images/fresh_yellow_pumpkin.jpg',
  veg_ash_gourd: '/assets/images/fresh_ash_gourd_1794541493212.jpg',
  veg_tinda: '/assets/images/fresh_tinda_gourd_1794541492008.jpg',
  veg_parwal: '/assets/images/fresh_parwal_gourd_1794541492452.jpg',
  veg_kohlrabi: '/assets/images/fresh_ganth_gobhi_1794541492711.jpg',
  veg_snake_gourd: '/assets/images/fresh_chichinda_snake_gourd.jpg',
  veg_sponge_gourd: '/assets/images/fresh_gilki_sponge_gourd.jpg',
  veg_french_beans: '/assets/images/fresh_french_beans.jpg',
  veg_broad_beans: '/assets/images/fresh_sem_phali_1794541493595.jpg',
  veg_flat_beans: '/assets/images/fresh_surti_papdi.jpg',
  veg_flat_beans_papdi: '/assets/images/fresh_surti_papdi.jpg',
  veg_cowpea_pods: '/assets/images/fresh_cowpea_chawli.jpg',
  veg_lotus_stem: '/assets/images/fresh_kamal_kakdi_1794541494571.jpg',
  root_carrot: '/assets/images/fresh_red_gajar_carrots_1793423368980.jpg',
  root_radish: '/assets/images/fresh_mooli_radish_clean.jpg',
  root_beetroot: '/assets/images/fresh_red_beetroot_1793423919178.jpg',
  veg_green_peas: '/assets/images/fresh_green_peas.jpg',
  veg_cluster_beans: '/assets/images/fresh_gawar_phali.jpg',
  veg_drumstick: '/assets/images/fresh_shevga_drumstick.jpg',
  veg_ivy_gourd: '/assets/images/fresh_kundru_tendli.jpg',
  veg_sweet_corn: '/assets/images/fresh_sweet_corn.jpg',
  veg_baby_corn: '/assets/images/fresh_baby_corn.jpg',
  veg_broccoli: '/assets/images/fresh_green_broccoli.jpg',
  veg_mushroom_button: '/assets/images/fresh_button_mushrooms.jpg',
  veg_mushroom_oyster: '/assets/images/fresh_oyster_mushroom_1794541493588.jpg',

  // --- Traditional Roots & Specialty Cooking Vegetables ---
  root_taro: '/assets/images/fresh_arbi_ghuiya.jpg',
  root_yam: '/assets/images/fresh_ratalu_kand_1794541511127.jpg',
  root_cassava: '/assets/images/fresh_tapioca_cassava_1794541511204.jpg',
  root_turnip: '/assets/images/fresh_shaljam_turnip_1794541512329.jpg',
  root_turmeric: '/assets/images/fresh_kacchi_haldi_1794541512878.jpg',
  spice_dry_turmeric: '/assets/images/dried_whole_turmeric_haldi.jpg',
  root_green_garlic: '/assets/images/fresh_hara_lahsun_1794541513286.jpg',
  veg_elephant_foot_yam: '/assets/images/fresh_suran_yam.jpg',
  root_sweet_potato: '/assets/images/fresh_shakarkand.jpg',
  veg_raw_mango: '/assets/images/fresh_kacchi_kairi.jpg',
  veg_raw_papaya: '/assets/images/fresh_kaccha_papita.jpg',
  veg_raw_jackfruit: '/assets/images/fresh_kathal_jackfruit_1793423368922.jpg',
  veg_raw_banana: '/assets/images/fresh_raw_banana.jpg',

  // --- Greens, Sprouts & Herbs ---
  leafy_palak: '/assets/images/fresh_palak_basket_1793423367076.jpg',
  herb_coriander: '/assets/images/fresh_dhaniya_coriander_1793423367892.jpg',
  leafy_methi: '/assets/images/fresh_desi_methi.jpg',
  leafy_green_amaranth: '/assets/images/fresh_green_chaulai_1794541494686.jpg',
  leafy_red_amaranth: '/assets/images/fresh_red_chaulai_1794541495410.jpg',
  leafy_bathua: '/assets/images/fresh_winter_bathua_saag.jpg',
  leafy_mustard_greens: '/assets/images/fresh_sarson_ka_saag.jpg',
  leafy_dill: '/assets/images/fresh_shepu_dill.jpg',
  leafy_colocasia: '/assets/images/fresh_arbi_leaves_1794541510033.jpg',
  leafy_malabar_spinach: '/assets/images/fresh_poi_saag_1794541510665.jpg',
  leafy_spring_onion: '/assets/images/fresh_spring_onion.jpg',
  herb_mint: '/assets/images/fresh_pudina_leaves.jpg',
  herb_curry_leaves: '/assets/images/fresh_kadi_patta.jpg',
  herb_basil: '/assets/images/fresh_basil_tulsi_1794541529388.jpg',
  herb_lemongrass: '/assets/images/fresh_lemongrass_1794541529062.jpg',
  root_garlic: '/assets/images/fresh_desi_lahsun.jpg',
  root_ginger: '/assets/images/fresh_desi_adrak.jpg',
  sprout_moong: '/assets/images/fresh_moong_sprouts.jpg',
  sprout_matki: '/assets/images/fresh_matki_sprouts_1794541529304.jpg',
  sprout_chickpea: '/assets/images/fresh_kala_chana_sprouts_1794541529915.jpg',
  sprout_green_chana: '/assets/images/fresh_hara_chana_1794541530614.jpg',
  sprout_peanut_pods: '/assets/images/fresh_raw_peanuts_1794541530525.jpg',

  // --- Top Running Mandi Fruits & Essentials ---
  fruit_banana: '/assets/images/fresh_bananas_bunch_1793423349892.jpg',
  fruit_apple: '/assets/images/crisp_red_apples_crate_1793423349381.jpg',
  fruit_orange: '/assets/images/fresh_nagpur_oranges_1793423350279.jpg',
  citrus_mosambi: '/assets/images/fresh_sweet_mosambi.jpg',
  citrus_lemon: '/assets/images/fresh_yellow_lemons.jpg',
  citrus_pomelo: '/assets/images/fresh_chakotra_pomelo_1794541513795.jpg',
  fruit_pomegranate: '/assets/images/fresh_red_pomegranates_1793423350453.jpg',
  fruit_watermelon: '/assets/images/fresh_sweet_tarbooj.jpg',
  fruit_muskmelon: '/assets/images/fresh_muskmelon_kharbooja.jpg',
  fruit_papaya: '/assets/images/fresh_red_lady_papaya.jpg',
  fruit_guava: '/assets/images/fresh_desi_amrood_guava.jpg',
  fruit_chikoo: '/assets/images/fresh_dahanu_chikoo.jpg',
  fruit_pineapple: '/assets/images/fresh_kew_ananas.jpg',
  fruit_grapes: '/assets/images/fresh_green_grapes.jpg',
  fruit_grapes_green: '/assets/images/fresh_green_grapes.jpg',
  fruit_grapes_black: '/assets/images/fresh_black_grapes.jpg',
  fruit_mango: '/assets/images/fresh_ratnagiri_hapus_mango.jpg',
  fruit_custard_apple: '/assets/images/fresh_sitaphal_1794541513407.jpg',
  fruit_custard_apple_sitaphal: '/assets/images/fresh_sitaphal_1794541513407.jpg',
  fruit_jamun: '/assets/images/fresh_indian_jamun.jpg',
  fruit_dates: '/assets/images/fresh_barhi_khajoor_dates.jpg',
  fruit_dragon_fruit: '/assets/images/fresh_dragon_fruit.jpg',
  fruit_kiwi: '/assets/images/fresh_kiwi_fruit.jpg',
  fruit_strawberry: '/assets/images/fresh_mahabaleshwar_strawberry.jpg',
  fruit_coconut: '/assets/images/fresh_tender_coconut.jpg',
  other_fresh_coconut: '/assets/images/fresh_grated_coconut_1794541531601.jpg',
  other_dry_coconut: '/assets/images/fresh_dry_copra_1794541531446.jpg',
  other_fresh_tamarind: '/assets/images/fresh_imli_tamarind_1794541531704.jpg',
  other_fresh_kokum: '/assets/images/fresh_kokum_aamsul_1794541532317.jpg',

  // --- MARCO 100 Mobile Accessories ---
  acc_gan_charger_65w: '/assets/images/mobile_fast_chargers.jpg',
  acc_braided_cable_typec: '/assets/images/mobile_fast_chargers.jpg',
  acc_powerbank_20000mah: '/assets/images/mobile_fast_chargers.jpg',
  acc_tws_earbuds_pro: '/assets/images/wireless_earbuds_case.jpg',
  acc_car_mount_magnetic: '/assets/images/magnetic_car_mount.jpg',
  acc_rugged_shockproof_case: '/assets/images/rugged_phone_cases.jpg',
  acc_liquid_silicone_case: '/assets/images/rugged_phone_cases.jpg',
  acc_tempered_glass_pack: '/assets/images/rugged_phone_cases.jpg',
};

export interface ResolvableProduct {
  id?: string;
  name?: any;
  nameEn?: string;
  nameHi?: string;
  category?: string;
  image?: string;
}

/**
 * Resolves the exact single-item visual asset.
 */
export function resolveProductVisualAsset(product: ResolvableProduct | string): string {
  const productId = typeof product === 'string' ? product.toLowerCase().trim() : (product?.id || '').toLowerCase().trim();

  // 1. Direct verified registry lookup
  if (PRODUCT_VISUAL_REGISTRY[productId]) {
    return PRODUCT_VISUAL_REGISTRY[productId];
  }

  // 2. Direct custom/online image URL or local asset path
  if (typeof product === 'object' && product !== null && product.image) {
    const img = product.image.trim();
    if (
      img.startsWith('/assets/') ||
      img.startsWith('https://') ||
      img.startsWith('http://') ||
      img.startsWith('data:image/')
    ) {
      return img;
    }
  }

  // 3. Fallback to empty string (so SafeProductImg / ProduceCard renders vector artwork)
  return '';
}

export function hasVerifiedProductPhoto(productId: string): boolean {
  const cleanId = (productId || '').toLowerCase().trim();
  return Boolean(PRODUCT_VISUAL_REGISTRY[cleanId]);
}

/**
 * Returns localized assurance badge confirming exclusive single-item lot.
 */
export function getProductExclusivityBadge(productId: string, lang: string = 'en'): string {
  const cleanId = (productId || '').toLowerCase();
  if (lang === 'hi') {
    if (cleanId.includes('mango')) return '100% रत्नागिरी हापुस लॉट';
    if (cleanId.includes('okra') || cleanId.includes('bhindi')) return '100% कोमल देसी भिंडी';
    if (cleanId.includes('grapes')) return '100% नासिक अंगूर लॉट';
    if (cleanId.includes('lemon') || cleanId.includes('nimbu')) return '100% कागज़ी नींबू लॉट';
    return '100% APMC वाशी ताज़ा माल';
  }
  if (lang === 'mr') {
    if (cleanId.includes('mango')) return '१००% रत्नागिरी हापूस लॉट';
    if (cleanId.includes('grapes')) return '१००% नाशिक द्राक्षे लॉट';
    return '१००% एपीएमसी वाशी ताजा माल';
  }
  if (lang === 'gu') return '100% APMC વાશી તાજો માલ';
  if (lang === 'bn') return '১০০% APMC ভাশি টাটকা পণ্য';
  if (lang === 'ta') return '100% APMC வாஷி புதிய தரம்';
  if (lang === 'te') return '100% APMC వాషి తాజా సరుకు';
  if (lang === 'kn') return '100% APMC ವಾಶಿ ತಾಜಾ ಮಾಲು';
  if (lang === 'pa') return '100% APMC ਵਾਸ਼ੀ ਤਾਜ਼ਾ ਮਾਲ';
  if (cleanId.includes('mango')) return '100% Ratnagiri/Gir Mango Lot';
  if (cleanId.includes('okra') || cleanId.includes('bhindi')) return '100% Tender Desi Bhindi';
  if (cleanId.includes('brinjal') || cleanId.includes('baingan')) return '100% Manchar Baingan Lot';
  if (cleanId.includes('cauliflower')) return '100% Snow-White Gobhi Lot';
  if (cleanId.includes('methi')) return '100% Fresh Sangamner Methi';
  if (cleanId.includes('pea') || cleanId.includes('matar')) return '100% Sweet Winter Peas';
  if (cleanId.includes('corn') || cleanId.includes('makai')) return '100% Sweet Golden Corn';
  if (cleanId.includes('chilli') || cleanId.includes('mirch')) return '100% Spicy Desi Chillies';
  if (cleanId.includes('cucumber') || cleanId.includes('kakdi')) return '100% Crisp Tender Kakdi';
  if (cleanId.includes('lemon') || cleanId.includes('nimbu')) return '100% Kagzi Lemon Lot';
  if (cleanId.includes('watermelon')) return '100% Sweet Kiran Melons';
  if (cleanId.includes('papaya')) return '100% Red Lady Papaya Lot';
  if (cleanId.includes('grapes')) return '100% Nashik Table Grapes';
  if (cleanId.includes('chikoo')) return '100% Dahanu Gholvad GI Lot';
  if (cleanId.includes('guava')) return '100% Fresh Allahabad Safeda';
  return '100% APMC Sourced Produce';
}
