import { useState, useEffect } from "react";
import useAxios from "axios-hooks";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import Badge from "./Badge";
import ComboBox from "./ComboBox";
import Spinner from "./Spinner";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
import utcPlugin from "dayjs/plugin/utc";

dayjs.extend(isBetween);
dayjs.extend(utcPlugin);

const endPoint =
  "https://script.google.com/macros/s/AKfycbwTHoBwo4RKtAo1Gz3ad0e8ydwUI4TBACO1Wcqnu9FYu_SFHRTVeXJuPHSeRx9o6W_T/exec";

const validMonths = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

export default function StatsTable() {
  const [{ data, loading, error }] = useAxios(endPoint + "?route=getStats");

  const [filteredData, setFilteredData] = useState(null);

  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedStartMonth, setSelectedStartMonth] = useState("");
  const [selectedEndMonth, setSelectedEndMonth] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const redirectToDashboard = () => {
    const monthNameMap = {
      JANUARY: 0,
      FEBRUARY: 1,
      MARCH: 2,
      APRIL: 3,
      MAY: 4,
      JUNE: 5,
      JULY: 6,
      AUGUST: 7,
      SEPTEMBER: 8,
      OCTOBER: 9,
      NOVEMBER: 10,
      DECEMBER: 11,
    };

    const startMonth = selectedStartMonth.name
      ? dayjs().month(monthNameMap[selectedStartMonth.name]).startOf("month")
      : dayjs().month(0).startOf("month");

    const endMonth = selectedEndMonth.name
      ? dayjs().month(monthNameMap[selectedEndMonth.name]).endOf("month")
      : dayjs().month(11).endOf("month");

    const startOfMonth = startMonth.utc().format("YYYY-MM-DDTHH:mm:ss[Z]");
    const endOfMonth = endMonth.utc().format("YYYY-MM-DDTHH:mm:ss[Z]");

    navigate(
      `/?driver=${selectedDriver.name}&startMonth=${startOfMonth}&endMonth=${endOfMonth}`
    );
  };

  const handleFilterChange = (selectedValue, selector) => {
    switch (selector) {
      case "Driver Name":
        setSelectedDriver(selectedValue);
        setFilters((prev) => ({
          ...prev,
          [selector]: selectedValue,
        }));
        break;
      case "Start Month":
        setSelectedStartMonth(selectedValue);
        setFilters((prev) => ({
          ...prev,
          [selector]: selectedValue,
        }));
        break;
      case "End Month":
        setSelectedEndMonth(selectedValue);
        setFilters((prev) => ({
          ...prev,
          [selector]: selectedValue,
        }));
        break;
      default:
        break;
    }
  };

  const applyFilters = () => {
    if (!selectedDriver || !selectedDriver.name) {
      setErrorMessage("You need to select a driver");
      return;
    } else {
      setErrorMessage("");
    }
    if (data && data.stats) {
      const filtered = {};

      let driverName = filters["Driver Name"].name;

      if (data.stats[driverName]) {
        filtered[driverName] = data.stats[driverName];
      }
      const startMonth = filters["Start Month"] || { id: 0, name: "JANUARY" };
      const endMonth = filters["End Month"] || { id: 11, name: "DECEMBER" };
      if (!selectedStartMonth || !selectedStartMonth.name) {
        setSelectedStartMonth(startMonth);
      }

      if (!selectedEndMonth || !selectedEndMonth.name) {
        setSelectedEndMonth(endMonth);
      }

      console.log(startMonth, endMonth);
      const filteredMonths = filterByMonthRange(filtered, startMonth, endMonth);
      setFilteredData(filteredMonths);
    }
  };

  const filterByMonthRange = (data, startMonth, endMonth) => {
    const result = {};

    const startMonthIndex = validMonths.indexOf(startMonth.name);
    const endMonthIndex = validMonths.indexOf(endMonth.name);

    if (startMonthIndex === -1 || endMonthIndex === -1) {
      return {};
    }

    Object.keys(data).forEach((driverName) => {
      const monthsData = data[driverName];
      const filteredData = {};

      Object.keys(monthsData).forEach((month) => {
        const monthIndex = validMonths.indexOf(month);

        if (monthIndex >= startMonthIndex && monthIndex <= endMonthIndex) {
          filteredData[month] = monthsData[month];
        }
      });

      if (Object.keys(filteredData).length > 0) {
        result[driverName] = filteredData;
      }
    });

    return result;
  };

  const handleClear = () => {
    setFilters({
      "Driver Name": "",
      "Start Month": { id: 0, name: "JANUARY" },
      "End Month": { id: 11, name: "DECEMBER" },
    });
    setSelectedDriver("");
    setSelectedStartMonth("");
    setSelectedEndMonth("");
    setFilteredData(null);
  };

  const [filters, setFilters] = useState({
    "Driver Name": "",
    "Start Month": { id: 0, name: "JANUARY" },
    "End Month": { id: 11, name: "DECEMBER" },
  });

  if (loading) {
    return <Spinner />;
  }

  const hasFilteredData = filteredData && Object.keys(filteredData).length > 0;

  const filteredRows = [];
  if (hasFilteredData) {
    Object.entries(filteredData).forEach(([driverName, monthsData]) => {
      Object.entries(monthsData).forEach(([month, reasons]) => {
        Object.entries(reasons).forEach(([reason, count]) => {
          if (
            count > 0 &&
            !reason.startsWith("Total") &&
            !reason.startsWith("total") &&
            !reason.startsWith("RUNING")
          ) {
            filteredRows.push(
              <tr key={`${driverName}-${month}-${reason}`}>
                <td className="px-6 py-4 whitespace-nowrap">{month}</td>
                <td className="px-6 py-4 whitespace-nowrap">{reason}</td>
                <td className="px-6 py-4 whitespace-nowrap">{count}</td>
              </tr>
            );
          }
        });
      });
    });
  }

  console.log(data);

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-start md:items-start lg:items-center lg:justify-around">
        <div className="sm:flex justify-between w-full">
          <button
            onClick={redirectToDashboard}
            className="flex items-center h-9 w-50 rounded-md bg-[#125e4d] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 mt-4 mr-4 mb-4 sm:mb-4"
          >
            <i
              className="fa fa-arrow-left text-2xl align-middle"
              style={{ marginRight: "0.25rem" }}
            ></i>
            <span>Go to</span>
            <span className="ml-1">Dashboard</span>
          </button>

          <ComboBox
            title="Driver"
            items={
              data && data.driversStats
                ? data.driversStats.map((driverArray, i) => ({
                    id: i,
                    name: driverArray[0],
                  }))
                : []
            }
            selectedPerson={selectedDriver}
            setSelectedPerson={(e) => handleFilterChange(e, "Driver Name")}
          />

          <div className="block">
            <label
              className="block text-sm font-medium leading-6 text-gray-900 mb-2"
              htmlFor="start"
            >
              Start Month:
            </label>
            <ComboBox
              items={validMonths.map((month, i) => ({ id: i, name: month }))}
              selectedPerson={selectedStartMonth}
              setSelectedPerson={(e) => handleFilterChange(e, "Start Month")}
            />
          </div>

          <div className="block">
            <label
              className="block text-sm font-medium leading-6 text-gray-900 mb-2"
              htmlFor="end"
            >
              End Month:
            </label>
            <ComboBox
              items={validMonths.map((month, i) => ({ id: i, name: month }))}
              selectedPerson={selectedEndMonth}
              setSelectedPerson={(e) => handleFilterChange(e, "End Month")}
            />
          </div>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex">
          {/* <label className="block text-sm font-medium leading-6 text-gray-900 mb-2" htmlFor="start">End date:</label> */}
          <button
            type="button"
            onClick={applyFilters}
            className="block h-9 w-32 rounded-md bg-[#125e4d] px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 mt-4 mr-4"
          >
            Filter
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="block h-9 w-32 rounded-md bg-gray-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 mt-4"
          >
            Clear
          </button>
        </div>
      </div>

      {hasFilteredData ? (
        <table className="min-w-full divide-y divide-gray-200 mt-4">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Month
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Count
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRows.length > 0 ? (
              filteredRows
            ) : (
              <tr>
                <td colSpan="3" className="text-center text-gray-500">
                  No data to display
                </td>
              </tr>
            )}
          </tbody>
        </table>
      ) : (
        <p className="mt-4 text-center text-gray-500">No data to display</p>
      )}
      {errorMessage && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mt-4 rounded">
          <p>{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
