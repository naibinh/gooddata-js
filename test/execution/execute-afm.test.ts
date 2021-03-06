// Copyright (C) 2007-2018, GoodData(R) Corporation. All rights reserved.
import 'isomorphic-fetch';
import * as fetchMock from 'fetch-mock';
import { range } from 'lodash';
import { AFM, Execution } from '@gooddata/typings';
import {
    ExecuteAfmModule,
    getNextLimit,
    getNextOffset,
    mergePage,
    replaceLimitAndOffsetInUri
} from '../../src/execution/execute-afm';
import { XhrModule } from '../../src/xhr';

interface IPagesByOffset {
    [offset: string]: Execution.IExecutionResultWrapper;
}

const createExecuteAfm = () => new ExecuteAfmModule(new XhrModule(fetch, {}));

function createAttributeHeaderItem(name: string): Execution.IResultAttributeHeaderItem {
    return {
        attributeHeaderItem: {
            name,
            uri: `/gdc/md/projectId/obj/${name}`
        }
    };
}

function createMeasureHeaderItem(name: string, order: number): Execution.IResultMeasureHeaderItem {
    return {
        measureHeaderItem: {
            name,
            order
        }
    };
}

const A1 = createAttributeHeaderItem('a1');
const A2 = createAttributeHeaderItem('a2');
const A3 = createAttributeHeaderItem('a3');
const M1 = createMeasureHeaderItem('m1', 1);
const M2 = createMeasureHeaderItem('m2', 2);
const M3 = createMeasureHeaderItem('m3', 3);

describe('replaceLimitAndOffsetInUri', () => {
    it('should return correct results for 1 dimension', () => {
        const oldUri = '/gdc/app/projects/projectId/executionResults/123?limit=500&dimensions=1&offset=0';
        const limit = [5];
        const offset = [3];

        expect(
            replaceLimitAndOffsetInUri(oldUri, limit, offset)).toEqual(
            '/gdc/app/projects/projectId/executionResults/123?limit=5&dimensions=1&offset=3'
        );
    });

    it('should return correct results for 2 dimensions', () => {
        const oldUri = '/gdc/app/projects/projectId/executionResults/123?limit=500%2C500&dimensions=2&offset=0%2C0';
        const limit = [12, 12];
        const offset = [3, 9];

        expect(
            replaceLimitAndOffsetInUri(oldUri, limit, offset)).toEqual(
            '/gdc/app/projects/projectId/executionResults/123?limit=12%2C12&dimensions=2&offset=3%2C9'
        );
    });
});

describe('getNextOffset and getNextLimit', () => {
    describe('1 dimension', () => {
        it('should return correct values for total=[2]', () => {
            expect(getNextOffset([5], [0], [2])).toEqual([5]);
            expect(getNextLimit([5], [5], [2])).toEqual([-3]);
        });

        it('should return correct values for total=[5]', () => {
            expect(getNextOffset([5], [0], [5])).toEqual([5]);
            expect(getNextLimit([5], [5], [5])).toEqual([0]);
        });

        it('should return correct values for total=[10]', () => {
            // rows 0 - 4
            expect(getNextOffset([5], [0], [10])).toEqual([5]);
            expect(getNextLimit([5], [5], [10])).toEqual([5]);

            // rows 5 - 9
            expect(getNextOffset([5], [5], [10])).toEqual([10]);
            expect(getNextLimit([5], [10], [10])).toEqual([0]);
        });

        it('should return correct values for total=[12]', () => {
            // rows 0 - 4
            expect(getNextOffset([5], [0], [12])).toEqual([5]);
            expect(getNextLimit([5], [5], [12])).toEqual([5]);

            // rows 5 - 9
            expect(getNextOffset([5], [5], [12])).toEqual([10]);
            expect(getNextLimit([5], [10], [12])).toEqual([2]);

            // rows 10 - 11
            expect(getNextOffset([2], [10], [12])).toEqual([12]);
            expect(getNextLimit([2], [12], [12])).toEqual([0]);
        });
    });

    describe('2 dimensions', () => {
        it('should return correct values for total=[10,12]', () => {
            // rows 0 - 4; all columns
            expect(getNextOffset([5, 5], [0, 0], [10, 12])).toEqual([0, 5]);
            expect(getNextLimit([5, 5], [0, 5], [10, 12])).toEqual([5, 5]);

            expect(getNextOffset([5, 5], [0, 5], [10, 12])).toEqual([0, 10]);
            expect(getNextLimit([5, 5], [0, 10], [10, 12])).toEqual([5, 2]);

            expect(getNextOffset([5, 2], [0, 10], [10, 12])).toEqual([5, 0]); // next rows
            expect(getNextLimit([5, 2], [5, 0], [10, 12])).toEqual([5, 5]);

            // rows 5 - 9; all columns
            expect(getNextOffset([5, 5], [5, 0], [10, 12])).toEqual([5, 5]);
            expect(getNextLimit([5, 5], [5, 5], [10, 12])).toEqual([5, 5]);

            expect(getNextOffset([5, 5], [5, 5], [10, 12])).toEqual([5, 10]);
            expect(getNextLimit([5, 5], [5, 10], [10, 12])).toEqual([5, 2]);

            expect(getNextOffset([5, 2], [5, 10], [10, 12])).toEqual([10, 0]);
            expect(getNextLimit([5, 2], [10, 0], [10, 12])).toEqual([0, 5]);
        });

        it('should return correct values for total=[10,15]', () => {
            // rows 0 - 4; all columns
            expect(getNextOffset([5, 5], [0, 0], [10, 15])).toEqual([0, 5]);
            expect(getNextLimit([5, 5], [0, 5], [10, 15])).toEqual([5, 5]);

            expect(getNextOffset([5, 5], [0, 5], [10, 15])).toEqual([0, 10]);
            expect(getNextLimit([5, 5], [0, 10], [10, 15])).toEqual([5, 5]);

            expect(getNextOffset([5, 5], [0, 10], [10, 15])).toEqual([5, 0]); // next rows
            expect(getNextLimit([5, 5], [5, 0], [10, 15])).toEqual([5, 5]);

            // rows 5 - 9; all columns
            expect(getNextOffset([5, 5], [5, 0], [10, 15])).toEqual([5, 5]);
            expect(getNextLimit([5, 5], [5, 5], [10, 15])).toEqual([5, 5]);

            expect(getNextOffset([5, 5], [5, 5], [10, 15])).toEqual([5, 10]);
            expect(getNextLimit([5, 5], [5, 10], [10, 15])).toEqual([5, 5]);

            expect(getNextOffset([5, 5], [5, 10], [10, 15])).toEqual([10, 0]);
            expect(getNextLimit([5, 5], [10, 0], [10, 15])).toEqual([0, 5]);
        });

        it('should return correct values for total=[12,19]', () => {
            // rows 0 - 4; all columns
            expect(getNextOffset([5, 5], [0, 0], [12, 19])).toEqual([0, 5]);
            expect(getNextLimit([5, 5], [0, 5], [12, 19])).toEqual([5, 5]);

            expect(getNextOffset([5, 5], [0, 5], [12, 19])).toEqual([0, 10]);
            expect(getNextLimit([5, 5], [0, 10], [12, 19])).toEqual([5, 5]);

            expect(getNextOffset([5, 5], [0, 10], [12, 19])).toEqual([0, 15]);
            expect(getNextLimit([5, 5], [0, 15], [12, 19])).toEqual([5, 4]);

            expect(getNextOffset([5, 4], [0, 15], [12, 19])).toEqual([5, 0]); // next rows
            expect(getNextLimit([5, 4], [5, 0], [12, 19])).toEqual([5, 5]);

            // rows 5 - 9; all columns
            expect(getNextOffset([5, 5], [5, 0], [12, 19])).toEqual([5, 5]);
            expect(getNextLimit([5, 5], [5, 5], [12, 19])).toEqual([5, 5]);

            expect(getNextOffset([5, 5], [5, 5], [12, 19])).toEqual([5, 10]);
            expect(getNextLimit([5, 5], [5, 10], [12, 19])).toEqual([5, 5]);

            expect(getNextOffset([5, 5], [5, 10], [12, 19])).toEqual([5, 15]);
            expect(getNextLimit([5, 5], [5, 15], [12, 19])).toEqual([5, 4]);

            expect(getNextOffset([5, 4], [5, 15], [12, 19])).toEqual([10, 0]); // next rows
            expect(getNextLimit([5, 4], [10, 0], [12, 19])).toEqual([2, 5]);

            // rows 10 - 11; all columns
            expect(getNextOffset([2, 5], [10, 0], [12, 19])).toEqual([10, 5]);
            expect(getNextLimit([5, 5], [10, 5], [12, 19])).toEqual([2, 5]);

            expect(getNextOffset([2, 5], [10, 5], [12, 19])).toEqual([10, 10]);
            expect(getNextLimit([2, 5], [10, 10], [12, 19])).toEqual([2, 5]);

            expect(getNextOffset([2, 5], [10, 10], [12, 19])).toEqual([10, 15]);
            expect(getNextLimit([5, 5], [10, 15], [12, 19])).toEqual([2, 4]);

            expect(getNextOffset([2, 4], [10, 15], [12, 19])).toEqual([12, 0]);
            expect(getNextLimit([2, 4], [12, 0], [12, 19])).toEqual([0, 2]);
        });

        it('should return correct values for total=[12,10]', () => {
            // rows 0 - 4; all columns
            expect(getNextOffset([5, 5], [0, 0], [12, 10])).toEqual([0, 5]);
            expect(getNextLimit([5, 5], [0, 5], [12, 10])).toEqual([5, 5]);

            expect(getNextOffset([5, 5], [0, 5], [12, 10])).toEqual([5, 0]); // next rows
            expect(getNextLimit([5, 5], [5, 0], [12, 10])).toEqual([5, 5]);

            // rows 5 - 9; all columns
            expect(getNextOffset([5, 5], [5, 0], [12, 10])).toEqual([5, 5]);
            expect(getNextLimit([5, 5], [5, 5], [12, 10])).toEqual([5, 5]);

            expect(getNextOffset([5, 5], [5, 5], [12, 10])).toEqual([10, 0]); // next rows
            expect(getNextLimit([5, 5], [10, 0], [12, 10])).toEqual([2, 5]);

            // rows 10 - 11; all columns
            expect(getNextOffset([2, 5], [10, 0], [12, 10])).toEqual([10, 5]);
            expect(getNextLimit([2, 5], [10, 5], [12, 10])).toEqual([2, 5]);

            expect(getNextOffset([2, 5], [10, 5], [12, 10])).toEqual([12, 0]);
            expect(getNextLimit([2, 5], [12, 0], [12, 10])).toEqual([0, 2]);
        });

        it('should return correct values for total=[2,1]', () => { // two dimensions with empty second dimension
            expect(getNextOffset([5, 5], [0, 0], [2, 1])).toEqual([5, 0]);
            expect(getNextLimit([5, 5], [5, 0], [2, 1])).toEqual([-3, 1]);
        });

        it('should return correct values for total=[8,1]', () => { // two dimensions with empty second dimension
            // rows 0 - 4
            expect(getNextOffset([5, 5], [0, 0], [8, 1])).toEqual([5, 0]); // next rows
            expect(getNextLimit([5, 5], [5, 0], [8, 1])).toEqual([3, 1]);

            // rows 5 - 7
            expect(getNextOffset([3, 1], [5, 0], [8, 1])).toEqual([8, 0]);
            expect(getNextLimit([3, 1], [8, 0], [8, 1])).toEqual([0, 1]);
        });

        it('should return correct values for total=[1,2]', () => { // two dimensions with empty first dimension
            expect(getNextOffset([5, 5], [0, 0], [1, 2])).toEqual([5, 0]);
            expect(getNextLimit([5, 5], [5, 0], [1, 2])).toEqual([-4, 2]);
        });

        it('should return correct values for total=[1,8]', () => { // two dimensions with empty first dimension
            expect(getNextOffset([5, 5], [0, 0], [1, 8])).toEqual([0, 5]);
            expect(getNextLimit([5, 5], [0, 5], [1, 8])).toEqual([1, 3]);

            expect(getNextOffset([1, 3], [0, 5], [1, 8])).toEqual([1, 0]);
            expect(getNextLimit([1, 3], [1, 0], [1, 8])).toEqual([0, 1]);
        });

        it('should return correct values for total=[2,3]', () => {
            expect(getNextOffset([5, 5], [0, 0], [2, 3])).toEqual([5, 0]);
            expect(getNextLimit([5, 5], [5, 0], [2, 3])).toEqual([-3, 3]);
        });

        it('should return correct values for total=[2,5]', () => {
            expect(getNextOffset([5, 5], [0, 0], [2, 5])).toEqual([5, 0]);
            expect(getNextLimit([5, 5], [5, 0], [2, 5])).toEqual([-3, 5]);
        });

        it('should return correct values for total=[2,8]', () => {
            expect(getNextOffset([5, 5], [0, 0], [2, 8])).toEqual([0, 5]);
            expect(getNextLimit([5, 5], [0, 5], [2, 8])).toEqual([2, 3]);

            expect(getNextOffset([2, 3], [0, 5], [2, 8])).toEqual([2, 0]);
            expect(getNextLimit([2, 3], [2, 0], [2, 8])).toEqual([0, 2]);
        });

        it('should return correct values for total=[5,2]', () => {
            expect(getNextOffset([5, 5], [0, 0], [5, 2])).toEqual([5, 0]);
            expect(getNextLimit([5, 5], [5, 0], [5, 2])).toEqual([0, 2]);
        });

        it('should return correct values for total=[8,2]', () => {
            // rows 0 - 4
            expect(getNextOffset([5, 5], [0, 0], [8, 2])).toEqual([5, 0]); // next rows
            expect(getNextLimit([5, 5], [5, 0], [8, 2])).toEqual([3, 2]);

            // rows 5 - 7
            expect(getNextOffset([3, 2], [5, 0], [8, 2])).toEqual([8, 0]);
            expect(getNextLimit([3, 2], [8, 0], [8, 2])).toEqual([0, 2]);
        });

        it('should return correct values for total=[5,5]', () => {
            expect(getNextOffset([5, 5], [0, 0], [5, 5])).toEqual([5, 0]);
            expect(getNextLimit([5, 5], [5, 0], [5, 5])).toEqual([0, 5]);
        });

        it('should return correct values for total=[5,10]', () => {
            expect(getNextOffset([5, 5], [0, 0], [5, 10])).toEqual([0, 5]);
            expect(getNextLimit([5, 5], [0, 5], [5, 10])).toEqual([5, 5]);

            expect(getNextOffset([5, 5], [0, 5], [5, 10])).toEqual([5, 0]);
            expect(getNextLimit([5, 5], [5, 0], [5, 10])).toEqual([0, 5]);
        });
    });
});

describe('mergePage', () => {
    describe('1 dimension', () => {
        function getExecutionResult(offset: number, total: number): Execution.IExecutionResult {
            return {
                headerItems: [
                    [
                        [
                            A1
                        ]
                    ]
                ],
                data: [
                    offset + 1
                ],
                paging: {
                    count: [1],
                    offset: [offset],
                    total: [total]
                }
            };
        }

        it('should return correct result after merge 2 executionResults', () => {
            expect(mergePage(
                getExecutionResult(0, 2),
                getExecutionResult(1, 2)
            )).toEqual({
                headerItems: [
                    [
                        [
                            A1
                        ]
                    ]
                ],
                data: [
                    1,
                    2
                ],
                paging: {
                    count: [2],
                    offset: [0],
                    total: [2]
                }
            });
        });

        it('should return correct result after merge 3 executionResults', () => {
            const prevExecutionResult = mergePage(
                getExecutionResult(0, 3),
                getExecutionResult(1, 3)
            );

            expect(mergePage(
                prevExecutionResult,
                getExecutionResult(2, 3)
            )).toEqual({
                headerItems: [
                    [
                        [
                            A1
                        ]
                    ]
                ],
                data: [
                    1,
                    2,
                    3
                ],
                paging: {
                    count: [3],
                    offset: [0],
                    total: [3]
                }
            });
        });
    });

    describe('2 dimensions', () => {
        it('should return correct result for 1 attribute (with 3 values) and 3 measures with limit=[2,2]', () => {
            const pageWithOffset0x0: Execution.IExecutionResult = {
                headerItems: [
                    [
                        [
                            A1, A2
                        ]
                    ],
                    [
                        [
                            M1, M2
                        ]
                    ]
                ],
                data: [
                    [
                        11, 12
                    ],
                    [
                        21, 22
                    ]
                ],
                paging: {
                    count: [2, 2],
                    offset: [0, 0],
                    total: [3, 3]
                }
            };

            const pageWithOffset0x2: Execution.IExecutionResult = {
                headerItems: [
                    [
                        [
                            A1, A2
                        ]
                    ],
                    [
                        [
                            M3
                        ]
                    ]
                ],
                data: [
                    [
                        13
                    ],
                    [
                        23
                    ]
                ],
                paging: {
                    count: [2, 1],
                    offset: [0, 2],
                    total: [3, 3]
                }
            };

            const pageWithOffset2x0 = {
                headerItems: [
                    [
                        [
                            A3
                        ]
                    ],
                    [
                        [
                            M1, M2
                        ]
                    ]
                ],
                data: [
                    [
                        31, 32
                    ]
                ],
                paging: {
                    count: [1, 2],
                    offset: [2, 0],
                    total: [3, 3]
                }
            };

            const pageWithOffset2x2 = {
                headerItems: [
                    [
                        [
                            A3
                        ]
                    ],
                    [
                        [
                            M3
                        ]
                    ]
                ],
                data: [
                    [
                        33
                    ]
                ],
                paging: {
                    count: [1, 1],
                    offset: [2, 2],
                    total: [3, 3]
                }
            };

            const mergedFirstTwoPages: Execution.IExecutionResult = mergePage(
                pageWithOffset0x0,
                pageWithOffset0x2
            );

            expect(mergedFirstTwoPages).toEqual({
                headerItems: [
                    [
                        [
                            A1, A2
                        ]
                    ],
                    [
                        [
                            M1, M2, M3
                        ]
                    ]
                ],
                data: [
                    [
                        11, 12, 13
                    ],
                    [
                        21, 22, 23
                    ]
                ],
                paging: {
                    count: [2, 3],
                    offset: [0, 0],
                    total: [3, 3]
                }
            });

            const mergedFirstThreePages = mergePage(
                mergedFirstTwoPages,
                pageWithOffset2x0
            );

            expect(mergedFirstThreePages).toEqual({
                headerItems: [
                    [
                        [
                            A1, A2, A3
                        ]
                    ],
                    [
                        [
                            M1, M2, M3
                        ]
                    ]
                ],
                data: [
                    [
                        11, 12, 13
                    ],
                    [
                        21, 22, 23
                    ],
                    [
                        31, 32
                    ]
                ],
                paging: {
                    count: [3, 3],
                    offset: [0, 0],
                    total: [3, 3]
                }
            });

            const mergedAllFourPages = mergePage(
                mergedFirstThreePages,
                pageWithOffset2x2
            );

            expect(mergedAllFourPages).toEqual({
                headerItems: [
                    [
                        [
                            A1, A2, A3
                        ]
                    ],
                    [
                        [
                            M1, M2, M3
                        ]
                    ]
                ],
                data: [
                    [
                        11, 12, 13
                    ],
                    [
                        21, 22, 23
                    ],
                    [
                        31, 32, 33
                    ]
                ],
                paging: {
                    count: [3, 3],
                    offset: [0, 0],
                    total: [3, 3]
                }
            });
        });
    });
});

describe('executeAfm', () => {
    beforeEach(() => {
        expect.hasAssertions();
        fetchMock.restore();
    });

    function getExecution(numOfDimensions: number = 2): AFM.IExecution {
        const dimension = { itemIdentifiers: [] };

        return {
            execution: {
                afm: {},
                resultSpec: {
                    dimensions: Array(numOfDimensions).fill(dimension)
                }
            }
        };
    }

    function getExecutionResponse(numOfDimensions: number = 2): Execution.IExecutionResponse {
        const dimension = { headers: [] };

        return {
            dimensions: Array(numOfDimensions).fill(dimension),
            links: {
                executionResult: `/gdc/app/projects/myFakeProjectId/executionResults/123?limit=overridden&dimensions=${numOfDimensions}` // tslint:disable-line:max-line-length
            }
        };
    }

    function getPollingResponseBody(numOfDimensions: number = 2): string {
        const response: Execution.IExecutionResponseWrapper = {
            executionResponse: getExecutionResponse(numOfDimensions)
        };

        return JSON.stringify(response);
    }

    function getExecutionResult(): Execution.IExecutionResult {
        return {
            data: [
                [11, 12],
                [51, 52]
            ],
            paging: {
                count: [2, 2],
                offset: [0, 0],
                total: [2, 2]
            },
            headerItems: [
                [
                    [{
                        attributeHeaderItem: {
                            name: 'A1',
                            uri: '/gdc/md/obj/attr1'
                        }
                    }, {
                        attributeHeaderItem: {
                            name: 'A2',
                            uri: '/gdc/md/obj/attr2'
                        }
                    }]
                ],
                [
                    [{
                        measureHeaderItem: {
                            name: 'M1',
                            order: 0
                        }
                    }, {
                        measureHeaderItem: {
                            name: 'M2',
                            order: 0
                        }
                    }]
                ]
            ]
        };
    }

    function getExecutionResultResponseBody(): string {
        const result: Execution.IExecutionResultWrapper = {
            executionResult: getExecutionResult()
        };

        return JSON.stringify(result);
    }

    it('should reject when /executeAfm fails', () => {
        fetchMock.mock(
            '/gdc/app/projects/myFakeProjectId/executeAfm',
            400
        );

        return createExecuteAfm().executeAfm('myFakeProjectId', getExecution()).catch((err) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.response.status).toBe(400);
        });
    });

    it('should reject when first polling fails', () => {
        fetchMock.mock(
            '/gdc/app/projects/myFakeProjectId/executeAfm',
            { status: 200, body: getPollingResponseBody() }
        );

        fetchMock.mock(
            '/gdc/app/projects/myFakeProjectId/executionResults/123?limit=500%2C500&dimensions=2&offset=0%2C0',
            400
        );

        return createExecuteAfm().executeAfm('myFakeProjectId', getExecution()).catch((err) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.response.status).toBe(400);
        });
    });

    it('should resolve when first polling returns 204', () => {
        fetchMock.mock(
            '/gdc/app/projects/myFakeProjectId/executeAfm',
            { status: 200, body: getPollingResponseBody() }
        );

        fetchMock.mock(
            '/gdc/app/projects/myFakeProjectId/executionResults/123?limit=500%2C500&dimensions=2&offset=0%2C0',
            204
        );

        return createExecuteAfm().executeAfm('myFakeProjectId', getExecution())
            .then((responses: Execution.IExecutionResponses) => {
                expect(responses).toEqual({
                    executionResponse: getExecutionResponse(),
                    executionResult: null
                });
            });
    });

    it('should reject when first polling returns 413', () => {
        fetchMock.mock(
            '/gdc/app/projects/myFakeProjectId/executeAfm',
            { status: 200, body: getPollingResponseBody() }
        );

        fetchMock.mock(
            '/gdc/app/projects/myFakeProjectId/executionResults/123?limit=500%2C500&dimensions=2&offset=0%2C0',
            413
        );

        return createExecuteAfm().executeAfm('myFakeProjectId', getExecution()).catch((err) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.response.status).toBe(413);
        });
    });

    it('should resolve on first polling', () => {
        fetchMock.mock(
            '/gdc/app/projects/myFakeProjectId/executeAfm',
            { status: 200, body: getPollingResponseBody() }
        );

        fetchMock.mock(
            '/gdc/app/projects/myFakeProjectId/executionResults/123?limit=500%2C500&dimensions=2&offset=0%2C0',
            { status: 200, body: getExecutionResultResponseBody() }
        );

        return createExecuteAfm().executeAfm('myFakeProjectId', getExecution())
            .then((responses: Execution.IExecutionResponses) => {
                expect(responses).toEqual({
                    executionResponse: getExecutionResponse(),
                    executionResult: getExecutionResult()
                });
            });
    });

    it('should resolve on second polling', () => {
        fetchMock.mock(
            '/gdc/app/projects/myFakeProjectId/executeAfm',
            { status: 200, body: getPollingResponseBody() }
        );

        let pollingCounter = 0;

        fetchMock.mock(
            '/gdc/app/projects/myFakeProjectId/executionResults/123?limit=500%2C500&dimensions=2&offset=0%2C0',
            () => {
                pollingCounter += 1;
                return pollingCounter === 1
                    ? {
                        status: 202,
                        headers: {
                            Location: '/gdc/app/projects/myFakeProjectId/executionResults/' +
                            '123?limit=500%2C500&dimensions=2&offset=0%2C0'
                        }
                    }
                    : {
                        status: 200,
                        body: getExecutionResultResponseBody()
                    };
            }
        );

        return createExecuteAfm().executeAfm('myFakeProjectId', getExecution())
            .then((responses: Execution.IExecutionResponses) => {
                expect(responses).toEqual({
                    executionResponse: getExecutionResponse(),
                    executionResult: getExecutionResult()
                });
            });
    });

    it('should resolve with 2x2 pages', () => {
        fetchMock.mock(
            '/gdc/app/projects/myFakeProjectId/executeAfm',
            { status: 200, body: getPollingResponseBody() }
        );

        const pagesByOffset: IPagesByOffset = {
            '0,0': {
                executionResult: {
                    headerItems: [
                        [
                            [
                                ...range(1, 501).map(i => createAttributeHeaderItem(`a${i}`))
                            ]
                        ],
                        [
                            [
                                ...range(1, 501).map(i => createMeasureHeaderItem(`m${i}`, i))
                            ]
                        ]
                    ],
                    data: Array(500).fill(0).map(() => Array(500).fill(0)),
                    paging: {
                        count: [500, 500],
                        offset: [0, 0],
                        total: [501, 501]
                    }
                }
            },
            '0,500': {
                executionResult: {
                    headerItems: [
                        [
                            [
                                ...range(1, 501).map(i => createAttributeHeaderItem(`a${i}`))
                            ]
                        ],
                        [
                            [
                                createMeasureHeaderItem('m501', 501)
                            ]
                        ]
                    ],
                    data: Array(500).fill([0]),
                    paging: {
                        count: [500, 1],
                        offset: [0, 500],
                        total: [501, 501]
                    }
                }
            },
            '500,0': {
                executionResult: {
                    headerItems: [
                        [
                            [
                                createAttributeHeaderItem('a501')
                            ]
                        ],
                        [
                            [
                                ...range(1, 501).map(i => createMeasureHeaderItem(`m${i}`, i))
                            ]
                        ]
                    ],
                    data: [
                        Array(500).fill(0)
                    ],
                    paging: {
                        count: [1, 500],
                        offset: [500, 0],
                        total: [501, 501]
                    }
                }
            },
            '500,500': {
                executionResult: {
                    headerItems: [
                        [
                            [
                                createAttributeHeaderItem('a501')
                            ]
                        ],
                        [
                            [
                                createMeasureHeaderItem('m501', 501)
                            ]
                        ]
                    ],
                    data: [
                        [
                            0
                        ]
                    ],
                    paging: {
                        count: [1, 1],
                        offset: [500, 500],
                        total: [501, 501]
                    }
                }
            }
        };

        fetchMock.mock(
            'glob:/gdc/app/projects/myFakeProjectId/executionResults/123?limit=*%2C*&dimensions=2&offset=*',
            (url: string): any => {
                const offset = url.replace(/.*offset=/, '').replace('%2C', ',');
                return { status: 200, body: JSON.stringify(pagesByOffset[offset]) };
            }
        );

        return createExecuteAfm().executeAfm('myFakeProjectId', getExecution())
            .then((responses: Execution.IExecutionResponses) => {
                expect(responses).toEqual({
                    executionResponse: getExecutionResponse(),
                    executionResult: {
                        headerItems: [
                            [
                                [
                                    ...range(1, 502).map(i => createAttributeHeaderItem(`a${i}`))
                                ]
                            ],
                            [
                                [
                                    ...range(1, 502).map(i => createMeasureHeaderItem(`m${i}`, i))
                                ]
                            ]
                        ],
                        data: Array(501).fill(0).map(() => Array(501).fill(0)),
                        paging: {
                            count: [501, 501],
                            offset: [0, 0],
                            total: [501, 501]
                        }
                    }
                });
            });
    });

    it('should resolve for 1 dimension x 2 pages', () => {
        fetchMock.mock(
            '/gdc/app/projects/myFakeProjectId/executeAfm',
            { status: 200, body: getPollingResponseBody(1) }
        );

        const pagesByOffset: IPagesByOffset = {
            0: {
                executionResult: {
                    headerItems: [
                        [
                            [
                                M1
                            ]
                        ]
                    ],
                    data: range(1, 501),
                    paging: {
                        count: [500],
                        offset: [0],
                        total: [501]
                    }
                }
            },
            500: {
                executionResult: {
                    headerItems: [
                        [
                            [
                                M1
                            ]
                        ]
                    ],
                    data: [
                        501
                    ],
                    paging: {
                        count: [1],
                        offset: [500],
                        total: [501]
                    }
                }
            }
        };

        fetchMock.mock(
            'glob:/gdc/app/projects/myFakeProjectId/executionResults/123?limit=*&dimensions=1&offset=*',
            (url) => {
                const offset = url.replace(/.*offset=/, '');
                return { status: 200, body: JSON.stringify(pagesByOffset[offset]) };
            }
        );

        return createExecuteAfm()
            .executeAfm('myFakeProjectId', {
                execution: {
                    afm: {},
                    resultSpec: {
                        dimensions: [
                            { itemIdentifiers: ['m1'] }
                        ]
                    }
                }
            })
            .then((responses: Execution.IExecutionResponses) => {
                expect(responses).toEqual({
                    executionResponse: getExecutionResponse(1),
                    executionResult: {
                        headerItems: [
                            [
                                [
                                    {
                                        measureHeaderItem: {
                                            name: 'm1',
                                            order: 1
                                        }
                                    }
                                ]
                            ]
                        ],
                        data: range(1, 502),
                        paging: {
                            count: [501],
                            offset: [0],
                            total: [501]
                        }
                    }
                });
            });
    });
});
