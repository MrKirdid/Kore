-- Kore.Fusion — Re-export of elttob/fusion

local Packages = game:GetService("ReplicatedStorage"):FindFirstChild("Packages")

local ok, Fusion = pcall(function()
	return require(Packages and Packages:FindFirstChild("fusion") or error("not found"))
end)

if ok then
	return Fusion
end

warn("[Kore] Fusion package not found in Packages — Kore.Fusion will not be available")
return nil
