import * as days from 'days';
import {SimpleOpeningHours} from 'simple-opening-hours';

export default class openingHours {

    /**
     * Get opening hours for a specific day.
     * @param {int} i Day index
     * @param {string} value Human-readable opening hours for this day
     * @return {string} tr element
     */
    static getOpeningHoursRow(i, value) {
        let row = '<tr><th>' + days[i] + '</th><td>';

        if (value.length > 0) {
            for (let i = 0; i < value.length; i++) {
                row += value[i];
                if (i !== value.length - 1) {
                    row += '<br/>';
                }
            }
        } else {
            row += 'Closed';
        }
        row += '</td></tr>';

        return row;
    }

    /**
     * Get a table containing opening hours.
     * @param  {string} value Value of the opening_hours tag
     * @return {string}       Set of tr elements
     */
    static getOpeningHoursTable(value) {
        const opening = new SimpleOpeningHours(value);

        const hours = opening.getTable();
        let table = '';
        let emptyDays = 0;

        for (let i = 0; i < days.short.length; i++) {
            const dayValue = hours[days.short[i].toLowerCase()];
            table += this.getOpeningHoursRow(i, dayValue);

            if (dayValue.length === 0) {
                emptyDays++;
            }
        }

        // SimpleOpeningHours returns 7 empty arrays when it could not parse the value.
        if (emptyDays === 7) {
            return "<tr><th>Sorry, we don't have enough info</th></tr>";
        }

        return table;
    }
}
