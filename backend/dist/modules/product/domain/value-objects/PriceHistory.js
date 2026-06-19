"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceHistory = void 0;
const ValueObject_1 = require("../../../../shared/domain/ValueObject");
class PriceHistory extends ValueObject_1.ValueObject {
    constructor(props) {
        super(props);
    }
    get oldPrice() { return this.props.oldPrice; }
    get newPrice() { return this.props.newPrice; }
    get changedAt() { return this.props.changedAt; }
}
exports.PriceHistory = PriceHistory;
