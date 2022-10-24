interface navigation {
    id: string;
    displayName: string;
    isPlugin: boolean;
    enabled: boolean;
    visible: boolean;
    url: string;
    priority: number;
}

export default interface HomepageJson {
    default: {
        navigation: navigation[];
    };
    npe: {
        navigation: navigation[];
    };
}
