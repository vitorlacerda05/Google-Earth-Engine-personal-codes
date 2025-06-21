# Google Earth Engine Scripts Collection 🌍

This repository contains a set of scripts developed for the **Google Earth Engine (GEE)** platform between 2021 and 2022. These scripts are focused on remote sensing, environmental monitoring, and geospatial data analysis using satellite imagery, primarily from **Sentinel** and **Landsat** missions.

## 🌐 What is Google Earth Engine?

[Google Earth Engine](https://earthengine.google.com/) is a cloud-based geospatial analysis platform that enables users to process and analyze petabytes of satellite imagery and other geospatial datasets. It is widely used in academia, government, NGOs, and industry for applications such as environmental monitoring, land cover classification, agricultural assessment, climate research, and more.

With a JavaScript-based code editor and access to massive public datasets, GEE allows users to create, visualize, and share powerful geospatial analyses at scale.

---

## 📁 Repository Structure and Script Descriptions

Below is a list of scripts included in this repository, along with a brief description of their functionality:

| File Name                                   | Description                                                                                                          |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Calculate\_Area.js**                      | Script to compute the area of selected features or regions in a satellite image.                                     |
| **Cloud\_Masking\_Sentinel.js**             | Implements cloud masking for Sentinel-2 imagery using quality bands and thresholds.                                  |
| **Creating\_Fade\_Legend.js**               | Dynamically creates a fading color legend for map visualizations.                                                    |
| **Creating\_Legend.js**                     | Generates a static legend for visualizing classified or continuous raster data.                                      |
| **Features\_Clip.js**                       | Clips satellite imagery or datasets to a defined region of interest using vector features.                           |
| **Function\_On\_Click.js**                  | Adds interactivity to the GEE map with functions that trigger on map click events.                                   |
| **Machine\_Learning.js**                    | Applies machine learning algorithms (e.g., classifiers) on satellite data for land use or land cover classification. |
| **NDVI\_EVI\_Creating\_Charts.js**          | Generates time series charts for NDVI and EVI indices using charting tools in GEE.                                   |
| **NDVI\_EVI\_Using\_Map.js**                | Displays NDVI and EVI layers on the map with appropriate visualization parameters.                                   |
| **NDVI\_MNDWI\_NDBI\_SAVI.js**              | Computes and displays multiple vegetation and water indices: NDVI, MNDWI, NDBI, and SAVI.                            |
| **NDVI\_Panels.js**                         | Combines NDVI analysis with UI panels for interactive selection and control.                                         |
| **Reduce\_Region.js**                       | Demonstrates the use of `reduceRegion` to summarize pixel values within a specific geometry.                         |
| **Surface\_Temperature.js**                 | Estimates surface temperature from thermal satellite imagery.                                                        |
| **Surface\_Temperature\_Reduce\_Region.js** | Combines surface temperature estimation with region reduction for statistical summaries.                             |
| **UI-Widgets.js**                           | Adds user interface widgets like dropdowns, sliders, and checkboxes to the GEE interface.                            |
| **README.md**                               | This file. Describes the content and purpose of the repository.                                                      |

---

## 🛠 How to Use

To use these scripts:

1. Visit the [GEE Code Editor](https://code.earthengine.google.com/).
2. Copy and paste any script into a new GEE script file.
3. Modify the parameters (e.g., region of interest, date range) as needed.
4. Run and visualize results directly in the GEE interface.

---

## 📅 Notes

* Developed in **2021–2022** during remote sensing and environmental data analysis projects.
* Mainly uses **JavaScript API** of Google Earth Engine.
* Intended for educational, research, and prototyping purposes.

---

## 📜 License

This repository is shared for academic and educational purposes. You may use and adapt the code with attribution. For commercial use, please ensure compliance with data source terms and Google Earth Engine’s policies.
