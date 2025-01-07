const { sql, poolPromise } = require("../db");

async function average_efficiency(production_id) {
    const pool = await poolPromise;

    // Query to calculate the average efficiency for the current hour
    const efficiencyQuery = `
        SELECT 
            AVG(efficiency) AS total_average_efficiency
        FROM Product_Production_Track
        WHERE production_id = @production_id
        AND updated_at >= DATEADD(HOUR, DATEPART(HOUR, GETDATE()), CAST(CAST(GETDATE() AS DATE) AS DATETIME))
        AND updated_at < DATEADD(HOUR, DATEPART(HOUR, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME))
    `;

    const efficiencyResult = await pool.request()
        .input('production_id', sql.Int, production_id)
        .query(efficiencyQuery);

    return efficiencyResult.recordset[0]?.total_average_efficiency || 0;
}

function createUsername(fullName) {
    // Split the full name into parts
    const nameParts = fullName.trim().split(" ");


    const normalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

    // Extract Firstname
    const firstName = normalize(nameParts[0]);

    // Extract Lastname
    const lastNameInitial = nameParts.length > 1 ? normalize(nameParts[nameParts.length - 1][0]) : "";

    // Combine the first name and last name initial
    const username = `${firstName}${lastNameInitial}`.trim();

    return username;
}

// Helper function to convert HH:mm:ss to total minutes
const convertTimeToMinutes = (timeString) => {
    try {
        const isValidTime = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(timeString);
        if (!isValidTime) throw new Error("Invalid time string format");
        const [hours, minutes, seconds] = timeString.split(":").map(Number);
        return hours * 60 + minutes + seconds / 60;
    } catch (error) {
        console.error("Error converting time:", error.message);
        return 0;
    }
};

// Calculate efficiency based on production data
const calculateEfficiency = (packsProduced, requiredPerHour, downtime) => {

    if (requiredPerHour <= 0 || packsProduced < 0) {
        throw new Error("Invalid production or requirement values");
    }

    // Convert downtime (HH:mm:ss) to total minutes
    const downtimeMinutes = convertTimeToMinutes(downtime);

    // Calculate effective minutes (remaining time in the hour after downtime)
    const effectiveMinutes = 60 - downtimeMinutes;

    // Calculate expected production for the effective time
    const expectedProduction = (requiredPerHour / 60) * effectiveMinutes;

    // Calculate efficiency as a percentage
    const efficiency = (packsProduced / expectedProduction) * 100;

    // Return efficiency formatted to two decimal places
    return efficiency.toFixed(2);
};


// Calculate giveaway and giveaway percentage;
const calculateGiveaway = (average_weight_per_unit, packs_produced, unit_weight) => {

    if (packs_produced <= 0) {
        return { giveaway: 0, giveaway_percentage: 0 }; // No production, no giveaway
    }

    const standard_weight = Number(unit_weight) * 1000;
    const total_actual_weight = Number(average_weight_per_unit) * Number(packs_produced)
    const total_ideal_weight = Number(packs_produced) * standard_weight
    const giveaway = (total_actual_weight - total_ideal_weight) / 1000
    const giveaway_percentage = (giveaway / (total_ideal_weight / 1000)) * 100;
    return { giveaway, giveaway_percentage: Number(giveaway_percentage.toFixed(2)) }
}

const getProductById = async (product_id) => {
    try {
        const pool = await poolPromise;
        const product = await pool.request()
            .input('product_id', sql.Int, product_id)
            .query(`Select * from Product where product_id=@product_id`);
        return product.recordset[0];
    } catch (error) {
        throw error
    }
}

const getHourlyLogById = async (log_id) => {
    try {
        const pool = await poolPromise;
        const log = await pool.request()
            .input('log_id', sql.Int, log_id)
            .query(`Select * from Hourly_Production_Log where log_id=@log_id`);
        return log.recordset[0];
    } catch (error) {
        throw error
    }
}

const calculateAverageEfficiency = (products) => {
    if (products.length === 0) return 0; // Avoid division by zero for an empty array

    const totalEfficiency = products.reduce((sum, product) => sum + product.efficiency, 0);
    const averageEfficiency = totalEfficiency / products.length;
    console.log(totalEfficiency, averageEfficiency)

    return averageEfficiency;
};

const calculateTotalTonnage = (products) => {
    return products.reduce((total, product) => total + product.tonnage, 0);
};

const checkTotalProductChangeBySlot = async (start_time, end_time, production_id) => {
    try {
        const pool = await poolPromise;

        const track_change_product = await pool.request()
            .input('production_id', sql.Int, production_id)
            .input('start_time', sql.DateTime, start_time)
            .input('end_time', sql.DateTime, end_time)
            .query(`
                SELECT  
                    SUM(packs_produced) AS total_packs_produced 
                FROM Product_Change_Log 
                WHERE production_id = @production_id
                AND change_time >= @start_time 
                AND change_time <= @end_time
            `);
        const total_pakcs = track_change_product.recordset[0].total_packs_produced;
        const products = await pool.request()
            .input('production_id', sql.Int, production_id)
            .input('start_time', sql.DateTime, start_time)
            .input('end_time', sql.DateTime, end_time)
            .query(`
                SELECT  
                   *
                FROM Product_Change_Log 
                WHERE production_id = @production_id
                AND change_time >= @start_time 
                AND change_time <= @end_time
            `);

        const changedProducts = products.recordset
        const processProduct = await Promise.all(changedProducts.map(async (product) => {
            const downtime = await checkDowntimeForSlot(start_time, end_time, production_id)
            const { packs_per_hour, pack_weight } = await getProductById(product.old_product_id)
            const tonnage = (product.packs_produced * pack_weight) / 1000
            const efficiency = calculateEfficiency(product.packs_produced, packs_per_hour, (downtime || '00:00:00'))
            let { giveaway, giveaway_percentage } = calculateGiveaway(product.average_packs_weight, product.packs_produced, pack_weight)
            return {
                ...product,
                packs_per_hour,
                tonnage,
                efficiency: Number(efficiency),
                giveaway,
                giveaway_percentage
            }
        }))
        const changed_product_efficiency = calculateAverageEfficiency(processProduct);
        const total_changed_product_Tonnage = calculateTotalTonnage(processProduct)
        return {
            changed_product_efficiency,
            total_changed_product_Tonnage,
            products: processProduct,
            total_packs: total_pakcs !== null ? Number(total_pakcs) : 0
        }
    } catch (error) {
        throw error;
    }
};

const checkDowntimeForSlot = async (start_time, end_time, production_id) => {
    try {
        const pool = await poolPromise;

        const track_change_product = await pool.request()
            .input('production_id', sql.Int, production_id)
            .input('start_time', sql.DateTime, start_time)
            .input('end_time', sql.DateTime, end_time)
            .query(`
                SELECT  
                    CONVERT(VARCHAR(8), DATEADD(SECOND, SUM(DATEDIFF(SECOND, '00:00:00', duration_minutes)), '00:00:00'), 108) AS total_downtime_time
                From Downtime_Log
                WHERE production_id = @production_id
                AND status = 'Completed'
                AND log_time >= @start_time 
                AND log_time <= @end_time
            `);
        const total_downtime_time = track_change_product.recordset[0].total_downtime_time;
        return total_downtime_time ? total_downtime_time : '00:00:00'
    } catch (error) {
        throw error;
    }
};

const trackProductProduction = async(production_id, product_id)=>{
    try {
        const pool = await poolPromise;
        const productTrack = await pool.request()
        .input('production_id', sql.Int, production_id)
        .input('product_id', sql.Int, product_id)
        .query(`
            Select total_production, updated_packs_count FROM Product_Production_Track
            Where production_id=@production_id AND product_id=@product_id
        `)
        return  productTrack.recordset[0]
    } catch (error) {
        throw error
    }
}
module.exports = {
    createUsername,
    calculateEfficiency,
    calculateGiveaway,
    average_efficiency,
    getProductById,
    getHourlyLogById,
    checkTotalProductChangeBySlot,
    checkDowntimeForSlot,
    trackProductProduction
}