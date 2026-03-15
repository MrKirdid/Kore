-- Kore.Promise — Re-export of evaera/promise

local Packages = game:GetService("ReplicatedStorage"):FindFirstChild("Packages")
return require(Packages and Packages:FindFirstChild("promise") or error("[Kore] Promise package not found in Packages"))
