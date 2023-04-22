import { Fragment, useState, useEffect } from "react";

interface DataType {
  dcode: string,
  name: string,
  2550: string,
  2551: string,
  2552: string,
  2553: string,
  2554: string,
  2555: string,
  2556: string,
  2557: string,
  2558: string,
  2559: string
}

function findMinMaxPercentages (data: DataType): [number, number] {
  let minPercentage: number | null = null;
  let maxPercentage: number | null = null;

  for (const key in data) {
    if (key === "dcode" || key === "name") {
      continue;
    }
    const percentageMatch = parseFloat(data[key as keyof DataType].replace("%", ""));
    if (percentageMatch) {
      const percentage = percentageMatch;
      if (minPercentage === null || percentage < minPercentage) {
        minPercentage = percentage;
      }
      if (maxPercentage === null || percentage > maxPercentage) {
        maxPercentage = percentage;
      }
    }
  }

  if (minPercentage === null || maxPercentage === null) {
    return [0, 0];
  }

  return [minPercentage, maxPercentage];
}

function parseData(data: string) {
  const rows = data.split("\n");
  const headers = rows[0].split(",");
  const result = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].split(",");
    if (row.length !== headers.length) continue;
    const obj = {} as any;
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    result.push(obj);
  }

  return result;
}


function getMargin (data: DataType, key: keyof DataType): string {
  const value = parseFloat(data[key].replace("%", ""));
  const [min, max] = findMinMaxPercentages(data);
  const dis = Math.abs(min - max);
  let margin = 0;


  // minus -> minus
  if (min < 0 && max < 0) {
    if (value === min) {
      margin = 0;
    } else {
      margin = 100/dis*(Math.abs(value - min)) 
    }
  } 
  // plus -> plus
  else if (min > 0 && max > 0) {
    margin = 0;
  }
  // minus -> plus
  else {
    if (value > 0) {
      margin = 100/dis*Math.abs(min);
    } else if (value == min) {
      margin = 0;
    } else {
      margin = 100/dis*Math.abs(value - min) 
    }
  }

  return margin.toString() + '%';
}


function getWidth (data: DataType, key: keyof DataType): string {
  const value = parseFloat(data[key].replace("%", ""));
  const [min, max] = findMinMaxPercentages(data);
  const dis = Math.abs(min - max);
  let width = 0;

  // minus -> 0
  if (min < 0 && max < 0) {
    if (value === min) {
      width = 100;
    } else {
      width = 100-(100/dis*(Math.abs(value - min)));
    }
  }
  // plus -> plus
  else if (min > 0 && max > 0) {
    if (value === max) {
      width = 100;
    } else {
      width = 100-(100/dis*(Math.abs(value - max)));
    }
  }
  else {
    width = (100 / dis) * Math.abs(value);
  }

  return width.toString() + '%';
}


export default function BarChart() {
  const [data, setData] = useState<DataType[] | null>(null);
  const [area, setArea] = useState("พระนคร");
  const [areaData, setAreaData] = useState<DataType | null>(null);
  const [years, setYears] = useState<number[]>([0, 9]);

  useEffect(() => {
    if (data) {
      setAreaData(data.filter((item) => item.name === area)[0]);
    }
  }, [data, area]);

  useEffect(() => {
    fetch("/bkk_population_growth.csv")
      .then((res) => res.text())
      .then((data) => {
        const rawData = parseData(data);
        setData(rawData);
      });
  }, []);

  const handleSelectTime = (e) => {
    const newYears = years;
    console.log(e.target.value);
    if (e.target.id === "time-from" && e.target.value < years[1]) {
      newYears[0] = e.target.value;
    } else if (e.target.id === "time-to" && e.target.value > years[0]) {
      newYears[1] = e.target.value;
    }
    setYears([...newYears]);
  };

  if (!data || !areaData) {
    return <div>loading...</div>;
  }

  return (
    <>
      <div className="input-container">
        <div className="flex items-center gap-sm">
          <label>เขต</label>
          <select value={area} onChange={(e) => setArea(e.target.value)}>
            {data.map((d) => (
              <option value={d.name} key={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="time-sel-container">
          <div className="flex items-center gap-sm">
            <label>from</label>
            <select id="time-from" value={years[0]} onChange={handleSelectTime}>
              {Object.keys(data[0])
                .filter((item) => !["dcode", "name"].includes(item))
                .map((d, i) => (
                  <option key={d + i} value={i}>
                    {d}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex items-center gap-sm">
            <label>to</label>
            <select id="time-to" value={years[1]} onChange={handleSelectTime}>
              {Object.keys(data[0])
                .filter((item) => !["dcode", "name"].includes(item))
                .map((d, i) => (
                  <option key={d + i} value={i}>
                    {d}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bar-chart">
        <div className="chart-item border-hidden" />
        <div className="chart-item border-hidden flex justify-between">
          <div>{findMinMaxPercentages(areaData)[0]}%</div>
          <div>{findMinMaxPercentages(areaData)[1]}%</div>
        </div>
        {areaData &&
          Object.keys(areaData).map(
            (d, i) =>
              !["name", "dcode"].includes(d) &&
              parseInt(d.trim().charAt(d.trim().length - 1), 10) <= years[1] &&
              parseInt(d.trim().charAt(d.trim().length - 1), 10) >= years[0] && (
                <Fragment key={i}>
                  <div onClick={() => console.log(areaData[d])} className="chart-item border-r start">{d}</div>
                  <div
                    className="chart-item border-r"
                    style={{ width: "100%" }}
                  >
                    <div
                      style={{
                        backgroundColor: "#ED2E7C",
                        height: "100%",
                        marginLeft: getMargin(areaData, d),
                        width: getWidth(areaData, d),
                      }}
                    />
                  </div>
                </Fragment>
              )
          )}
      </div>
    </>
  );
}
