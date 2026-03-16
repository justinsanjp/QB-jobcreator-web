import { JobData, GeneratedFile } from '../types';

export const generateSharedLua = (job: JobData): string => {
  const gradesLua = job.grades.map(g => {
    // In QBCore shared/jobs.lua, 'isboss' is usually omitted if false
    const bossLine = g.isBoss ? `,\n                isboss = true` : '';
    return `            ['${g.level}'] = {
                name = '${g.name}',
                payment = ${g.payment}${bossLine}
            }`;
  }).join(',\n');

  return `-- 1. Add this snippet to your resources/[qb]/qb-core/shared/jobs.lua

['${job.name}'] = {
    label = '${job.label}',
    defaultDuty = ${job.defaultDuty},
    offDutyPay = ${job.offDutyPay},
    grades = {
${gradesLua}
    }
},`;
};

export const generateFxManifest = (job: JobData): string => {
  return `fx_version 'cerulean'
game 'gta5'

author '${job.author || 'Unknown'}'
description '${job.description || 'QB-Core Job Script'}'
version '1.0.0'

shared_scripts {
    '@qb-core/shared/locale.lua',
    'locales/en.lua',
    'config.lua'
}

client_scripts {
    'client/main.lua'
}

server_scripts {
    'server/main.lua'
}

lua54 'yes'`;
};

export const generateConfigLua = (job: JobData): string => {
  return `Config = {}

Config.Debug = false

-- Locations for job interactions
Config.Locations = {
    -- Place where players can go on/off duty
    duty = {
        vector3(440.085, -974.924, 30.689) -- Example Coords
    },
    -- Vehicle Spawners
    vehicle = {
        {
            coords = vector4(448.159, -1017.41, 28.562, 90.654), -- Example Coords
            spawnPoint = vector4(436.68, -1007.42, 27.32, 180.0)
        }
    },
    -- Personal Stash
    stash = {
        vector3(453.075, -980.124, 30.889) -- Example Coords
    },
    -- Boss Menu location
    boss = {
        vector3(462.23, -981.12, 30.68) -- Example Coords
    }
}

-- Blip Configuration
Config.Blip = {
    Sprite = 60, -- Change sprite id (https://docs.fivem.net/docs/game-references/blips/)
    Color = 3,   -- Change colour
    Scale = 0.8,
    Label = "${job.label}"
}

Config.AuthorizedVehicles = {
    [0] = {
        ["panto"] = "Panto", -- Example Vehicle
    },
    [1] = {
        ["panto"] = "Panto",
        ["faggio"] = "Faggio",
    }
}
`;
};

export const generateClientLua = (job: JobData): string => {
  return `local QBCore = exports['qb-core']:GetCoreObject()
local PlayerJob = {}

-- Utility: Draw 3D Text
local function DrawText3D(x, y, z, text)
    SetTextScale(0.35, 0.35)
    SetTextFont(4)
    SetTextProportional(1)
    SetTextColour(255, 255, 255, 215)
    SetTextEntry("STRING")
    SetTextCentre(true)
    AddTextComponentString(text)
    SetDrawOrigin(x, y, z, 0)
    DrawText(0.0, 0.0)
    ClearDrawOrigin()
end

-- Events
RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
    PlayerJob = QBCore.Functions.GetPlayerData().job
    if PlayerJob.name == "${job.name}" then
        -- Add any On-Load logic here
    end
end)

RegisterNetEvent('QBCore:Client:OnJobUpdate', function(JobInfo)
    PlayerJob = JobInfo
end)

-- Create Job Blips
CreateThread(function()
    for _, coords in pairs(Config.Locations.duty) do
        local blip = AddBlipForCoord(coords)
        SetBlipSprite(blip, Config.Blip.Sprite)
        SetBlipDisplay(blip, 4)
        SetBlipScale(blip, Config.Blip.Scale)
        SetBlipColour(blip, Config.Blip.Color)
        SetBlipAsShortRange(blip, true)
        BeginTextCommandSetBlipName("STRING")
        AddTextComponentString(Config.Blip.Label)
        EndTextCommandSetBlipName(blip)
    end
end)

-- Main Job Loop
CreateThread(function()
    while true do
        local sleep = 2000
        if LocalPlayer.state.isLoggedIn and PlayerJob.name == "${job.name}" then
            local pos = GetEntityCoords(PlayerPedId())
            
            -- Duty Marker Loop
            for k, v in pairs(Config.Locations.duty) do
                local dist = #(pos - v)
                if dist < 10.0 then
                    sleep = 0
                    DrawMarker(2, v.x, v.y, v.z, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.3, 0.2, 200, 0, 0, 150, false, false, false, true, false, false, false)
                    if dist < 1.5 then
                        DrawText3D(v.x, v.y, v.z + 0.3, "[E] Toggle Duty")
                        if IsControlJustReleased(0, 38) then
                            TriggerServerEvent("QBCore:ToggleDuty")
                        end
                    end
                end
            end

            -- Stash Loop (Only when On Duty)
            if PlayerJob.onduty then
                for k, v in pairs(Config.Locations.stash) do
                    local dist = #(pos - v)
                    if dist < 10.0 then
                        sleep = 0
                        DrawMarker(2, v.x, v.y, v.z, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.3, 0.2, 0, 0, 200, 150, false, false, false, true, false, false, false)
                        if dist < 1.5 then
                            DrawText3D(v.x, v.y, v.z + 0.3, "[E] Open Stash")
                            if IsControlJustReleased(0, 38) then
                                TriggerEvent("inventory:client:SetCurrentStash", "${job.name}stash")
                                TriggerServerEvent("inventory:server:OpenInventory", "stash", "${job.name}stash", {
                                    maxweight = 4000000,
                                    slots = 500,
                                })
                            end
                        end
                    end
                end
                
                -- Vehicle Spawners (Simplified)
                for k, v in pairs(Config.Locations.vehicle) do
                     local dist = #(pos - vector3(v.coords.x, v.coords.y, v.coords.z))
                     if dist < 10.0 then
                        sleep = 0
                        DrawMarker(36, v.coords.x, v.coords.y, v.coords.z, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.5, 0.5, 0.5, 0, 200, 0, 150, false, false, false, true, false, false, false)
                        if dist < 1.5 then
                            DrawText3D(v.coords.x, v.coords.y, v.coords.z + 0.3, "[E] Vehicle Menu")
                            -- Add vehicle menu logic here
                        end
                     end
                end
            end

        end
        Wait(sleep)
    end
end)
`;
};

export const generateServerLua = (job: JobData): string => {
  return `local QBCore = exports['qb-core']:GetCoreObject()

-- Toggle Duty Event
RegisterNetEvent('QBCore:ToggleDuty', function()
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    if Player.PlayerData.job.name == "${job.name}" then
        Player.Functions.SetJobDuty(not Player.PlayerData.job.onduty)
        TriggerClientEvent('QBCore:Notify', src, "Duty Toggled")
    end
end)
`;
};

export const generateSQL = (job: JobData): string => {
    const jobsSql = `INSERT INTO \`jobs\` (\`name\`, \`label\`, \`defaultDuty\`, \`offDutyPay\`) VALUES
('${job.name}', '${job.label}', ${job.defaultDuty ? 1 : 0}, ${job.offDutyPay ? 1 : 0});`;

    const gradesSqlLines = job.grades.map(g =>
        `('${job.name}', ${g.level}, '${g.name}', ${g.payment})`
    ).join(',\n');

    const gradesSql = `INSERT INTO \`job_grades\` (\`job_name\`, \`grade\`, \`name\`, \`payment\`) VALUES
${gradesSqlLines};`;

    return `-- Run this in your database query tool to insert the job and grades
-- Note: Modern QBCore uses shared/jobs.lua, but this is useful for SQL-based systems.

${jobsSql}

${gradesSql}`;
};

export const generateAllFiles = (job: JobData): GeneratedFile[] => {
  return [
    { filename: 'shared-jobs-snippet.lua', language: 'lua', content: generateSharedLua(job) },
    { filename: 'job.sql', language: 'sql', content: generateSQL(job) },
    { filename: 'fxmanifest.lua', language: 'lua', content: generateFxManifest(job) },
    { filename: 'config.lua', language: 'lua', content: generateConfigLua(job) },
    { filename: 'client/main.lua', language: 'lua', content: generateClientLua(job) },
    { filename: 'server/main.lua', language: 'lua', content: generateServerLua(job) },
  ];
};