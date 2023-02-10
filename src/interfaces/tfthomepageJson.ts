export interface LolClientSettingsTftTftBattlePassHub {
    battlePassXPBoosted: boolean;
}

export interface Event {
    titleTranslationKey: string;
    url: string;
}

export interface LolClientSettingsTftTftEvents {
    events: Event[];
}

export interface LolClientSettingsTftTftHomeHub {
    battlePassOfferIds: string[];
    enabled: boolean;
    fallbackStorePromoOfferIds: string[];
    storePromoOfferIds: string[];
    tacticianPromoOfferIds: string[];
}

export interface LolClientSettingsTftTftNewsHub {
    enabled: boolean;
    url: string;
}

export default interface TftHomepageJson {
    'lol.client_settings.tft.tft_battle_pass_hub': LolClientSettingsTftTftBattlePassHub;
    'lol.client_settings.tft.tft_events': LolClientSettingsTftTftEvents;
    'lol.client_settings.tft.tft_home_hub': LolClientSettingsTftTftHomeHub;
    'lol.client_settings.tft.tft_news_hub': LolClientSettingsTftTftNewsHub;
    'lol.client_settings.tft.tft_tastes_experiment_enabled': boolean;
}
