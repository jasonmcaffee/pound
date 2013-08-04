module.exports = (function(){

    var util = {
        /**
         * # Usage 1: copies properties & functions from obj2 into obj1, retaining the original names.
         * if obj1 already contains a property with the same name, obj1[prop] will still be updated to obj2[prop] value.
         * @param object obj1 - object you would like to copy properties into from obj2.
         * @param object obj2 - properties from this object will be copied into obj1.
         * @return object obj1 - the modified object passed in as parameter 1,
         * which includes properties and functions found in obj2.
         * @example
         * > var anObject = extend({x:1, y:2, z:3}, {x:4, z:5});
         * > anObject;
         *   Object {x: 4, y: 2, z: 5}
         * @example
         * > var obj1 = {x:9};
         * > var obj2 = {x:8};
         * > extend(obj1, obj2);
         *   Object {x: 8}
         * > obj1;
         *   Object {x: 8}
         *
         * # Usage 2: merging properties & functions from obj2 into obj1, retaining the original names.
         * if obj1 already contains a property with the same name, and override *passed in* as false, obj1[prop] will
         * be updated to obj2[prop] value.
         * @param object obj1 - object you would like to copy properties into from obj2.
         * @param object obj2 - properties from this object will be copied into obj1.
         * @param boolean override - default:true - if false, obj2[prop] will not be copied over if obj1[prop] already exists.
         * > var obj1 = {x:1, y:2, z:3};
         * > var obj2 = {w: 6, x:4, z:5};
         * > extend(obj1, obj2, false);
         *   Object {x: 1, y: 2, z: 3, w: 6}
         * > obj1;
         *   Object {x: 1, y: 2, z: 3, w: 6}
         */
        extend: function extend(obj1, obj2, override){
            if(obj1 && obj2){
                override = typeof override === 'undefined' ? true : override;//default:true
                for(var prop in obj2){
                    if(obj2.hasOwnProperty(prop)){
                        if(override || !obj1[prop]){
                            obj1[prop] = obj2[prop];
                        }
                    }
                }
            }//if incorrect params are passed, fail quietly.
            return obj1;
        }

    };

    return util;

})();