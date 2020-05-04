// (C) 2020 GoodData Corporation

import { XhrModule } from "./xhr";

export class BootstrapModule {
    constructor(private xhr: XhrModule) {}

    public getBootstrapData() {
        return this.xhr.get("/gdc/app/account/bootstrap").then((result: any) => result.getData());
    }

    public getMapboxToken() {
        // continue here
    }
}
