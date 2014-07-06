/*  Raspberry Pi Dasboard
 *  =====================
 *  Copyright 2014 Domen Ipavec <domen.ipavec@z-v.si>
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

registerPage('/storage', {
    templateUrl: 'partials/storage.html',
    controller: 'StorageController'
}, ['storage', 'logger'], "Storage");

storageData = {};
storageData.throughputRequest = {
    rate: true,
    format: []
};

backgroundUpdate(['storage', 'logger'], 1000, function(done) {
    if (storageData.throughputRequest.format.length == 0) {
        $.rpijs.get("storage/throughput", function(data) {
            var columns = [];
            var values = "";
            angular.forEach(data, function(item, name) {
                columns.push({
                    id: name,
                    label: name,
                    type: "number"
                });
                if (values.length != 0) {
                    values += "|";
                }
                values += "storage/throughput/"+name+"/total";
                storageData.throughputRequest.format.push({
                    key: [name, "total"],
                    rate: true
                });
            });
            storageData.throughputHistory = historyGraph(
                "LineChart",
                columns,
                {
                    legend: 'right'
                },
                bpsFilter,
                values
            );
            done.resolve();
        });
        return;
    }

    $.rpijs.get("storage/throughput", function(data) {
        var values = [];
        angular.forEach(data, function(item, name) {
            values.push(item.total);
        });
        storageData.throughputHistory.add(values);
        done.resolve();
    }, storageData.throughputRequest);
});

rpiDashboard.controller('StorageController', function($scope) {
    $.rpijs.get("storage/list", function(data) {
        $scope.$apply(function() {
            storageData.storageTable = {
                type: "Table",
                data: {
                    cols: [
                        {
                            id: "device",
                            label: "Device",
                            type: "string"
                        },
                        {
                            id: "mount",
                            label: "Mount point",
                            type: "string"
                        },
                        {
                            id: "filesystem",
                            label: "Filesystem",
                            type: "string"
                        },
                        {
                            id: "size",
                            label: "Size",
                            type: "number"
                        },
                        {
                            id: "use",
                            label: "Used",
                            type: "number"
                        }
                    ],
                    rows: []
                },
                options: {
                },
                formatters: {
                    bar: [
                        {
                            columnNum: 4,
                            max: 1
                        }
                    ]
                }
            };
            angular.forEach(data, function(item) {
                var size = vObject(item.size);
                size.f = bytesFilter(item.size);
                var use = vObject(item.use);
                use.f = procentsFilter(item.use);
                storageData.storageTable.data.rows.push(cObject([
                    vObject(item.device),
                    vObject(item.mount),
                    vObject(item.filesystem),
                    size,
                    use
                ]));
            });
        });
    });

    $scope.storageData = storageData;
});
