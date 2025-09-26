'use client'

import React from 'react'
import styled from 'styled-components'
import { useChainId } from 'wagmi'
import { getChainConfig } from '../config/chains'

const NetworkInfoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  margin: 8px 0;
`

const StatusDot = styled.div<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.color};
`

interface NetworkInfoProps {
  className?: string
}

export default function NetworkInfo({ className }: NetworkInfoProps) {
  const chainId = useChainId()
  const chainConfig = chainId ? getChainConfig(chainId) : null

  if (!chainConfig) {
    return null
  }

  return (
    <NetworkInfoContainer className={className}>
      <StatusDot color={chainConfig.color} />
      <span>Registering on {chainConfig.name}</span>
    </NetworkInfoContainer>
  )
}