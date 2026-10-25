"use strict";
/* Shared planning rules: exactly 2 morning, exactly 1 night, other available staff evening. */
window.NahdiShiftRules=Object.freeze({
 templates:[
 [
 ["off","n","n","n","n","n","n"],
 ["n","off","e3","e3","e3","e3","e3"],
 ["m1","m1","m1","m1","m1","off","m1"],
 ["m2","m2","m2","m2","m2","m2","off"],
 ["e3","e3","off","e3","e1","m2","m2"],
 ["e3","e3","e3","off","e3","e1","e3"],
 ["e3","e3","e3","e3","off","e1","e3"],
 ["e3","e3","e3","e3","e3","off","e3"],
 ["e3","e3","e3","e3","e3","e3","off"]
 ],
 [
 ["n","n","n","n","n","n","off"],
 ["e3","e3","e3","e3","e3","off","n"],
 ["off","m1","m1","m1","m1","m1","m1"],
 ["m2","m2","m2","off","m2","m2","m2"],
 ["m2","e3","e1","m2","off","e3","e3"],
 ["e3","off","e3","e3","e3","e1","e3"],
 ["e3","e3","off","e3","e3","e1","e3"],
 ["e3","e3","e3","e3","e3","off","e3"],
 ["e3","e3","e3","e3","e3","e3","off"]
 ]
 ],
 rolesForWeek(w){return this.templates[w%2]},
 isMorning(k){return k==="m1"||k==="m2"},
 isEvening(k){return k==="e1"||k==="e2"||k==="e3"}
});
