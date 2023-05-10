import fs from "fs";

interface Delivery {
    id: string;
    totalDuration: number;
    steps: Step[];
}

interface Step {
    vehicle: "plane" | "truck";
    duration: number;
}

interface ScheduleIncrement {
    planeDeliveries: string[];
    truckDeliveries: string[];
}

function scheduleDeliveries(deliveries: Delivery[], maxPlanes: number, maxTrucks: number): number {
    // sort deliveries by totalDuration (desc)
    const sortedDeliveries = deliveries.sort((a, b) => b.totalDuration - a.totalDuration);
    const schedule: ScheduleIncrement[] = [];

    sortedDeliveries.forEach((delivery) => {
        // track the index in `scheduled` that was used last in order to ensure the steps are performed in order (-1 so 0 can be used below)
        let lastUsedInc = -1;

        delivery.steps.forEach((step) => {
            // find the first time where a required vehicle is available and there are enough available schedule slots for the entire step
            const firstAvailable = schedule.findIndex((inc, i) => {
                if (step.vehicle === "plane") {
                    if (inc.planeDeliveries.length < maxPlanes && i > lastUsedInc) {
                        // check that there is room for the full duration of the step
                        let hasRoom = true;
                        for (let j = i; j < i + step.duration; j++) {
                            if (schedule[j] !== undefined && schedule[j].planeDeliveries.length >= maxPlanes) {
                                hasRoom = false;
                                break;
                            }
                        }
                        return hasRoom;
                    }
                    return false;
                } else {
                    if (inc.truckDeliveries.length < maxTrucks && i > lastUsedInc) {
                        let hasRoom = true;
                        for (let j = i; j < i + step.duration; j++) {
                            if (schedule[j] !== undefined && schedule[j].truckDeliveries.length >= maxTrucks) {
                                hasRoom = false;
                                break;
                            }
                        }
                        return hasRoom;
                    }
                    return false;
                }
            });

            // if there is a spot in the existing schedule, schedule increments equal to the duration. Otherwise, add to the end of the schedule
            if (firstAvailable !== -1) {
                for (let i = firstAvailable; i < firstAvailable + step.duration; i++) {
                    if (schedule[i] !== undefined) {
                        if (step.vehicle === "plane" && !schedule[i].planeDeliveries.includes(delivery.id)) {
                            schedule[i].planeDeliveries.push(delivery.id);
                            lastUsedInc = i;
                        } else if (step.vehicle === "truck" && !schedule[i].truckDeliveries.includes(delivery.id)) {
                            schedule[i].truckDeliveries.push(delivery.id);
                            lastUsedInc = i;
                        }
                    } else {
                        schedule[i] = {
                            planeDeliveries: step.vehicle === "plane" ? [delivery.id] : [],
                            truckDeliveries: step.vehicle === "truck" ? [delivery.id] : [],
                        };
                        lastUsedInc = i;
                    }
                }
            } else {
                schedule.push(
                    ...Array(step.duration)
                        .fill(null) // required to not fill with a single reference
                        .map(() => ({
                            planeDeliveries: step.vehicle === "plane" ? [delivery.id] : [],
                            truckDeliveries: step.vehicle === "truck" ? [delivery.id] : [],
                        }))
                );
                lastUsedInc = schedule.length - 1;
            }
        });
    });

    fs.writeFileSync("./schedule.json", JSON.stringify(schedule));
    console.log("Makespan:", schedule.length);
    return schedule.length;
}

const testData: Delivery[] = [
    {
        id: "1",
        totalDuration: 25,
        steps: [
            {
                vehicle: "plane",
                duration: 25,
            },
        ],
    },
    {
        id: "2",
        totalDuration: 45,
        steps: [
            {
                vehicle: "truck",
                duration: 20,
            },
            {
                vehicle: "plane",
                duration: 20,
            },
            {
                vehicle: "truck",
                duration: 5,
            },
        ],
    },
    {
        id: "3",
        totalDuration: 60,
        steps: [
            {
                vehicle: "plane",
                duration: 50,
            },
            {
                vehicle: "truck",
                duration: 10,
            },
        ],
    },
    {
        id: "4",
        totalDuration: 10,
        steps: [
            {
                vehicle: "truck",
                duration: 10,
            },
        ],
    },
    {
        id: "5",
        totalDuration: 120,
        steps: [
            {
                vehicle: "truck",
                duration: 30,
            },
            {
                vehicle: "plane",
                duration: 60,
            },
            {
                vehicle: "truck",
                duration: 30,
            },
        ],
    },
];

scheduleDeliveries(testData, 1, 1);
