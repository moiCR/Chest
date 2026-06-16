package models

import "time"

type License struct {
	ID        string    `gorm:"column:id;primaryKey" json:"id"`
	Key       string    `gorm:"column:key" json:"key"`
	ProductID string    `gorm:"column:product_id" json:"product_id"`
	Product   Product   `gorm:"foreignKey:ProductID" json:"product"`
	UserID    string    `gorm:"column:user_id" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"user"`
	Active    bool      `gorm:"column:active;default:true" json:"active"`
	MaxUses   int       `gorm:"column:max_uses;default:1" json:"max_uses"`
	UsedCount int       `gorm:"column:used_count;default:0" json:"used_count"`
	ExpiresAt time.Time `gorm:"column:expires_at" json:"expires_at"`
	Logs      []LicenseLog `gorm:"foreignKey:LicenseID" json:"logs"`
	CreatedAt time.Time    `gorm:"column:created_at" json:"created_at"`
	UpdatedAt time.Time    `gorm:"column:updated_at" json:"updated_at"`
}

func (License) TableName() string {
	return "Licenses"
}

type LicenseLog struct {
	ID         string    `gorm:"column:id;primaryKey" json:"id"`
	LicenseID  string    `gorm:"column:license_id" json:"license_id"`
	License    License   `gorm:"foreignKey:LicenseID" json:"-"`
	IP         string    `gorm:"column:ip" json:"ip"`
	Action     string    `gorm:"column:action" json:"action"`
	ServerName string    `gorm:"column:server_name" json:"server_name"`
	ServerPort int       `gorm:"column:server_port" json:"server_port"`
	Success    bool      `gorm:"column:success" json:"success"`
	CreatedAt  time.Time `gorm:"column:created_at" json:"created_at"`
}

func (LicenseLog) TableName() string {
	return "LicenseLogs"
}
