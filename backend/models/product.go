package models

import "time"

type Product struct {
	ID          string          `gorm:"column:id;primaryKey" json:"id"`
	Name        string          `gorm:"column:name" json:"name"`
	Description string          `gorm:"column:description" json:"description"`
	Price       float64         `gorm:"column:price" json:"price"`
	Version     string          `gorm:"column:version" json:"version"`
	Category    string          `gorm:"column:category" json:"category"`
	AuthorID    string          `gorm:"column:author_id" json:"author_id"`
	Author      User            `gorm:"foreignKey:AuthorID" json:"author"`
	Updates     []ProductUpdate `gorm:"foreignKey:ProductID" json:"updates"`
	Licenses    []License       `gorm:"foreignKey:ProductID" json:"licenses"`
	FileKey     string          `gorm:"column:file_key" json:"file_key"`
	FileName    string          `gorm:"column:file_name" json:"file_name"`
	FileSize    int64           `gorm:"column:file_size" json:"file_size"`
	Downloads   int64           `gorm:"column:downloads;default:0" json:"downloads"`
	Active      bool            `gorm:"column:active;default:true" json:"active"`
	CreatedAt   time.Time       `gorm:"column:created_at" json:"created_at"`
	UpdatedAt   time.Time       `gorm:"column:updated_at" json:"updated_at"`
}

func (Product) TableName() string {
	return "Products"
}

type ProductUpdate struct {
	ID          string    `gorm:"column:id;primaryKey" json:"id"`
	ProductID   string    `gorm:"column:product_id" json:"product_id"`
	Product     Product   `gorm:"foreignKey:ProductID" json:"-"`
	Version     string    `gorm:"column:version" json:"version"`
	Title       string    `gorm:"column:title" json:"title"`
	Description string    `gorm:"column:description" json:"description"`
	Type        string    `gorm:"column:type" json:"type"`
	FileKey     string    `gorm:"column:file_key" json:"file_key"`
	FileName    string    `gorm:"column:file_name" json:"file_name"`
	FileSize    int64     `gorm:"column:file_size" json:"file_size"`
	Downloads   int64     `gorm:"column:downloads;default:0" json:"downloads"`
	CreatedAt   time.Time `gorm:"column:created_at" json:"created_at"`
}

func (ProductUpdate) TableName() string {
	return "ProductUpdates"
}
